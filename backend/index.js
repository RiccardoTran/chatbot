const express = require('express');
const cors = require('cors'); // Importa il pacchetto CORS

const {
    Request,
    ChatHistory,
    Holder,
    ChatInferenceLlama3_8B
} = require('./modrefactored'); // Adjust the path as needed

const app = express();

// Usa il middleware CORS
app.use(cors());

app.use(express.json());

const request = new Request();
const chatHistory = new ChatHistory();
const mgr = {
    GetGroqKey: () => "Bearer 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" // Replace with your actual key management logic
};
const holder = new Holder(chatHistory, mgr, request);

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});

app.post('/chat', async (req, res) => {
    try {
        const { prompt, name, contextType } = req.body;
        const response = await ChatInferenceLlama3_8B(holder, prompt, name, contextType, () => []);
        res.json({ response });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
