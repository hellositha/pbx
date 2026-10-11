import { Request, Response } from 'express';
import { eslClient } from '../telephony/esl-client';

export async function getActiveCalls(req: Request, res: Response): Promise<void> {
  try {
    const channels = await eslClient.getActiveChannels();
    res.json({ calls: channels, channels });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve active calls', details: err.message });
  }
}

export async function holdCall(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const result = await eslClient.holdCall(id);
    res.json({ message: 'Hold state toggled', result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle call hold', details: err.message });
  }
}

export async function transferCall(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const destination = req.body.destination || req.body.target;

  if (!destination) {
    res.status(400).json({ error: 'Transfer destination is required' });
    return;
  }

  try {
    const result = await eslClient.transferCall(id, destination);
    res.json({ message: `Call transferred to ${destination}`, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to transfer call', details: err.message });
  }
}

export async function hangupCall(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { cause } = req.body;

  try {
    const result = await eslClient.hangupCall(id, cause || 'NORMAL_CLEARING');
    res.json({ message: 'Call terminated successfully', result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to terminate call', details: err.message });
  }
}

export async function originateCall(req: Request, res: Response): Promise<void> {
  const { destination, callerIdNumber, callerIdName } = req.body;

  if (!destination) {
    res.status(400).json({ error: 'Destination is required' });
    return;
  }

  try {
    const cidNum = callerIdNumber || '1000';
    const cidName = callerIdName || 'Eclype Tech PBX';
    const dialString = `{origination_caller_id_number=${cidNum},origination_caller_id_name='${cidName}'}user/${destination}`;
    const result = await eslClient.originate(dialString, '&echo');

    res.json({ message: 'Call originated', result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to originate call', details: err.message });
  }
}

export async function eavesdropCall(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { supervisorExt, mode = 'SPY' } = req.body;

  if (!supervisorExt) {
    res.status(400).json({ error: 'Supervisor extension is required' });
    return;
  }

  try {
    const dialString = `user/${supervisorExt}`;
    const eavesdropApp = `&eavesdrop(${id})`;
    const result = await eslClient.originate(dialString, eavesdropApp);

    res.json({ message: `Eavesdrop initiated mode ${mode} for Ext ${supervisorExt}`, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initiate eavesdrop', details: err.message });
  }
}
