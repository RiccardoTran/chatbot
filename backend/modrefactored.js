const https = require('https');
const { IncomingMessage } = require('http');

const groqKeyList = ["Bearer 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"];

class AiContext {
    constructor(name, content, language = "italiano") {
        this.name = `Sei un assistente e ti chiami ${name.trim()}.`;
        this.language = `Rispondi sempre in ${language}.`;
        this.content = content;
    }

    get Content() {
        return `<Context>${this.name}\nNon presentarti mai, limitati a dare la risposta.\n${this.language}\n${this.content}</Context>`;
    }
}

class Message {
    constructor(role, content) {
        if (!["system", "user"].includes(role)) {
            throw new Error("Role not valid");
        }
        this.role = role;
        this.content = content;
    }

    GetJson() {
        return { role: this.role, content: this.content };
    }
}

class RequestParams {
    constructor(headers, body) {
        this.headers = headers;
        this.body = body;
    }

    GetJson() {
        return { ...this.headers, ...this.body };
    }
}

class Result {
    constructor(isValid, payload, message = "Richiesta eseguita con Successo!") {
        this.isValid = isValid;
        this.payload = payload;
        this.message = message;
    }
}

class Util {
    static ListToString(list) {
        return list.join(";\n ") + ";\n";
    }

    static GetCompletion(payload) {
        if (!payload || !payload.choices || !Array.isArray(payload.choices)) {
            console.error("Payload non valido o mancante di choices:", payload);
            return [];
        }
        return payload.choices
            .filter(choice => choice && choice.message && typeof choice.message.content === 'string')
            .map(choice => choice.message.content);
    }
}

class Request {
    constructor() {
        this.manager = new https.Agent({ rejectUnauthorized: false });
    }

    async Post(url, params, PayloadDataExtract) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                method: 'POST',
                headers: params.headers,
                agent: this.manager
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let jsonData;
                    try {
                        jsonData = JSON.parse(data);
                        console.log("Risposta API completa:", JSON.stringify(jsonData, null, 2));
                    } catch (e) {
                        console.error("Errore nel parsing della risposta JSON:", e);
                        console.log("Dati ricevuti:", data);
                        reject(new Error("Errore nel parsing della risposta"));
                        return;
                    }

                    const payload = { data: PayloadDataExtract(jsonData), log: jsonData };
                    resolve(new Result(res.statusCode === 200, payload, res.statusCode !== 200 ? jsonData.error?.message : undefined));
                });
            });

            req.on('error', e => reject(new Error(e.message)));
            req.write(JSON.stringify(params.body));
            req.end();
        });
    }
}

class ChatHistory {
    constructor() {
        this.history = [];
    }

    AddMsg(msg) {
        this.history.push(msg);
    }

    RetrieveText() {
        return this.history.length > 0 ? `<Chat_history> {${Util.ListToString(this.history.map(msg => msg.content))}}</Chat_history>` : "";
    }
}

class Holder {
    constructor(chatHistory, mgr, request) {
        this.chatHistory = chatHistory;
        this.mgr = mgr;
        this.request = request;
    }
}

async function QueryMaker(holder, prompt, QueryContextType) {
    const params = new RequestParams(
        { "Authorization": holder.mgr.GetGroqKey(), "Content-Type": "application/json" },
        {
            model: "llama3-70b-8192",
            messages: [
                new Message("system", new AiContext("Marco", QueryContextType).Content),
                new Message("user", holder.chatHistory.RetrieveText() + prompt)
            ],
            max_tokens: 15000,
            temperature: 0.6
        }
    );

    const res = await holder.request.Post("https://api.groq.com/openai/v1/chat/completions", params, Util.GetCompletion);
    return res.isValid ? res.payload.data[0] : prompt;
}

async function CohereRerank(dataSource, prompt, topN, QueryContextType, scoreThreshold, holder) {
    const params = new RequestParams(
        { "Authorization": "Bearer XaH21JWIO0SFGbrhPpf2BZajIzrCqWa5PeNzv94Y", "Content-Type": "application/json" },
        {
            model: "rerank-multilingual-v3.0",
            query: await QueryMaker(holder, prompt, QueryContextType),
            top_n: topN,
            documents: dataSource
        }
    );

    const res = await holder.request.Post("https://api.cohere.com/v1/rerank", params, payload => payload.results);

    if (res.isValid && Array.isArray(res.payload.data)) {
        return res.payload.data
            .filter(result => result.relevance_score > scoreThreshold)
            .map(result => dataSource[result.index]);
    }

    return [];
}

async function ChatInferenceLlama3_8B(holder, prompt, name, contextType, retrieveMethod) {
    const context = new Message("system", new AiContext("Marco", "Sei un assistente amichevole.").Content);
    const userPrompt = new Message("user", prompt);

    const params = new RequestParams(
        { "Authorization": holder.mgr.GetGroqKey(), "Content-Type": "application/json" },
        {
            model: "mixtral-8x7b-32768",
            messages: [
                context,
                new Message("user", holder.chatHistory.RetrieveText()),
                userPrompt
            ],
            max_tokens: 15000,
            temperature: 0.6
        }
    );

    const res = await holder.request.Post("https://api.groq.com/openai/v1/chat/completions", params, Util.GetCompletion);

    if (res.isValid) {
        holder.chatHistory.AddMsg(userPrompt);
        holder.chatHistory.AddMsg(new Message("system", res.payload.data[0]));
        return res.payload.data[0];
    } else {
        return res.message;
    }
}

module.exports = {
    AiContext,
    Message,
    RequestParams,
    Result,
    Util,
    Request,
    ChatHistory,
    Holder,
    QueryMaker,
    CohereRerank,
    ChatInferenceLlama3_8B
};