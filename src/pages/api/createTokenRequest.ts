import Ably from "ably/promises";
import { NextApiRequest, NextApiResponse } from "next";
let options: Ably.Types.ClientOptions = { key: process.env.ABLY_API_KEY };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = new Ably.Realtime(options);
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: req.query.clientId as string });
  res.status(200).json(tokenRequestData);
};