package com.eclypetech.pbx;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "EclypeTechPBXPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER_URL = "http://49.156.43.92/";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final int FILE_CHOOSER_REQUEST_CODE = 2001;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private LinearLayout splashOverlay;
    private TextView errorMessage;
    private Button btnRetry;
    private Button btnSettings;

    private SharedPreferences preferences;
    private ValueCallback<Uri[]> filePathCallback;
    private PermissionRequest pendingPermissionRequest;
    private boolean isInitialLoadComplete = false;
    private long backPressedTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen awake for VoIP communication
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        preferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        initViews();
        setupWebView();
        setupSwipeRefresh();
        checkAndRequestPermissions();
        setupBackNavigation();

        // Load configured server
        loadPBXServer();
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        splashOverlay = findViewById(R.id.splashOverlay);
        errorMessage = findViewById(R.id.errorMessage);
        btnRetry = findViewById(R.id.btnRetry);
        btnSettings = findViewById(R.id.btnSettings);

        btnRetry.setOnClickListener(v -> {
            errorLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            loadPBXServer();
        });

        btnSettings.setOnClickListener(v -> showServerSettingsDialog());

        // Long press splash or background allows quick server config
        splashOverlay.setOnLongClickListener(v -> {
            showServerSettingsDialog();
            return true;
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Core capabilities
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // WebRTC audio/video & media autoplay
        settings.setMediaPlaybackRequiresUserGesture(false);

        // File access for audio recording and upload
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Viewport & Zoom
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Mixed content (HTTP & WebSockets)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Cache mode
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Custom User-Agent
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " EclypeTechPBX/1.0.0 (Android; Mobile)");

        // Enable cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // WebChromeClient: Handles WebRTC permissions, file chooser, and progress
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                MainActivity.this.runOnUiThread(() -> {
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) ||
                            PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            // Automatically grant WebRTC Audio / Video capture
                            request.grant(request.getResources());
                            return;
                        }
                    }
                    request.grant(resources);
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                super.onPermissionRequestCanceled(request);
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return super.onConsoleMessage(consoleMessage);
            }

            // Android 5.0+ File Chooser for audio uploads and backup restore
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                              FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                    return true;
                } catch (Exception e) {
                    Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                    contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                    contentSelectionIntent.setType("*/*");
                    startActivityForResult(Intent.createChooser(contentSelectionIntent, "Select File"), FILE_CHOOSER_REQUEST_CODE);
                    return true;
                }
            }
        });

        // WebViewClient: Handles navigation, SSL, and error events
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if ("tel".equalsIgnoreCase(scheme)) {
                    // Launch phone dialer
                    Intent intent = new Intent(Intent.ACTION_DIAL, uri);
                    startActivity(intent);
                    return true;
                } else if ("mailto".equalsIgnoreCase(scheme)) {
                    // Launch email client
                    Intent intent = new Intent(Intent.ACTION_SENDTO, uri);
                    startActivity(intent);
                    return true;
                } else if ("intent".equalsIgnoreCase(scheme) || "market".equalsIgnoreCase(scheme)) {
                    try {
                        Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return true;
                    }
                }

                // Keep regular PBX web traffic inside the webview
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                swipeRefresh.setRefreshing(false);

                if (!isInitialLoadComplete) {
                    isInitialLoadComplete = true;
                    // Dismiss splash screen with a subtle delay for smooth rendering
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        splashOverlay.animate()
                                .alpha(0f)
                                .setDuration(350)
                                .withEndAction(() -> splashOverlay.setVisibility(View.GONE))
                                .start();
                    }, 400);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    swipeRefresh.setRefreshing(false);
                    showErrorScreen("Failed to connect to PBX server. (" + error.getDescription() + ")");
                }
            }
        });
    }

    private void setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(
                R.color.colorAccent,
                R.color.colorPrimary
        );
        swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.surfaceColor);

        swipeRefresh.setOnRefreshListener(() -> {
            errorLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });

        // Disable swipe refresh when scrolled down inside WebView
        webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
            swipeRefresh.setEnabled(scrollY == 0);
        });
    }

    private void loadPBXServer() {
        String serverUrl = preferences.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
            serverUrl = "http://" + serverUrl;
        }
        if (!serverUrl.endsWith("/")) {
            serverUrl = serverUrl + "/";
        }
        webView.loadUrl(serverUrl);
    }

    private void showErrorScreen(String message) {
        if (splashOverlay.getVisibility() == View.VISIBLE) {
            splashOverlay.setVisibility(View.GONE);
        }
        webView.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
        errorMessage.setText(message);
    }

    private void showServerSettingsDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(R.string.dialog_server_title);

        View dialogView = LayoutInflater.from(this).inflate(android.R.layout.simple_list_item_1, null, false);
        final EditText input = new EditText(this);
        input.setHint(R.string.dialog_server_hint);
        String currentUrl = preferences.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        input.setText(currentUrl);
        input.setSingleLine(true);
        input.setPadding(40, 30, 40, 30);

        builder.setView(input);

        builder.setPositiveButton(R.string.btn_save, (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                preferences.edit().putString(KEY_SERVER_URL, newUrl).apply();
                Toast.makeText(this, "Connecting to: " + newUrl, Toast.LENGTH_SHORT).show();
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                loadPBXServer();
            }
        });

        builder.setNegativeButton(R.string.btn_cancel, (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void checkAndRequestPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.CAMERA);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this,
                    permissionsNeeded.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE
            );
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, R.string.permission_rationale, Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    } else if (data.getClipData() != null) {
                        int numSelected = data.getClipData().getItemCount();
                        results = new Uri[numSelected];
                        for (int i = 0; i < numSelected; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (System.currentTimeMillis() - backPressedTime < 2000) {
                        finish();
                    } else {
                        backPressedTime = System.currentTimeMillis();
                        Toast.makeText(MainActivity.this, "Press back again to exit ECLYPE TECH", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
