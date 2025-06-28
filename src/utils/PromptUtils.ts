import { CommitCoach } from "../App/CommitCoach";
import prompts from "prompts"
export async function askForMessage(defaultMsg: string): Promise<string> {
    const res = await prompts({
        type: "text",
        name: "message",
        message: "Proposez ou modifiez le message de commit :",
        initial: defaultMsg
    });

    return res.message;
}

export async function askToConfirm(msg: string): Promise<boolean> {
    const res = await prompts({
        type: "confirm",
        name: "confirm",
        message: msg,
        initial: true
    });

    return res.confirm;
}
