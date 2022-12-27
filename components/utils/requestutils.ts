import { NextApiRequest, NextApiResponse } from "next";

export function sendResponseInvalid(req: NextApiRequest, res: NextApiResponse, msg: string) {
    res.status(405).json({ message: 'Invalid request.', error: 'Invalid request' });
    console.log("Invalid request: " + msg + " Request: " + req)
}

export function sendResponseInvalidTransparent(req: NextApiRequest, res: NextApiResponse, msg: string) {
    res.status(405).json({ message: `Invalid request: ${msg}` });
    console.log("Invalid request: " + msg + " Request: " + req)
}

export function isPost(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        sendResponseInvalid(req, res, "POST required.")
        return false
    }

    return true
}

export function hasParams(req: NextApiRequest, res: NextApiResponse, ...value: any){
    for(const val of value){
        if(val == undefined){
            sendResponseInvalid(req, res, "Parameters missing.")
            return false
        }
    }

    return true
}

export function sendResponseValid(req: NextApiRequest, res: NextApiResponse, send?: any) {
    const response: any = send || { message: 'Success' }
    res.status(200).json(response);
    console.log("Valid request: " + req + " Response: " + response)
}