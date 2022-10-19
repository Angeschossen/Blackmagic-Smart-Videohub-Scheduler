import { NextApiResponse } from "next";

export function sendResponseInvalid(res: NextApiResponse) {
    res.status(405).json({ message: 'Invalid request.' });
}