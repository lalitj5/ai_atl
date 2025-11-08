// server.js - Backend server for Azure OpenAI Whisper transcription and translation
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { AzureOpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop() || 'webm';
        cb(null, `recording-${Date.now()}.${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024
    }
});

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Validate environment variables
if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.error('ERROR: Missing required environment variables!');
    console.error('Please set:');
    console.error('  - AZURE_OPENAI_API_KEY');
    console.error('  - AZURE_OPENAI_ENDPOINT');
    console.error('  - AZURE_OPENAI_DEPLOYMENT (optional, defaults to "whisper")');
    process.exit(1);
}

// Initialize Azure OpenAI client
const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: '2024-02-01'
});

// Get deployment name from environment or use default
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'whisper';

console.log('Azure OpenAI Configuration:');
console.log('  Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
console.log('  Deployment:', deploymentName);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Azure Whisper Transcription & Translation API',
        deployment: deploymentName
    });
});

// Main transcription endpoint (with optional translation)
app.post('/transcribe', upload.single('audio'), async (req, res) => {
    let audioFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                message: 'Please upload an audio file'
            });
        }

        audioFilePath = req.file.path;
        const fileSize = req.file.size;

        // Check if translation is requested (default: true for auto-translate)
        const translate = req.body.translate !== 'false'; // defaults to true

        if (fileSize > 25 * 1024 * 1024) {
            return res.status(400).json({
                error: 'File too large',
                message: 'Audio file must be less than 25MB for Azure OpenAI Whisper'
            });
        }

        const startTime = Date.now();

        let result;

        if (translate) {
            // Use translations endpoint - automatically translates to English
            result = await client.audio.translations.create({
                model: deploymentName,
                file: fs.createReadStream(audioFilePath)
            });
        } else {
            // Use transcriptions endpoint - transcribes in original language
            result = await client.audio.transcriptions.create({
                model: deploymentName,
                file: fs.createReadStream(audioFilePath)
            });
        }

        const processingTime = Date.now() - startTime;
        console.log('TRANSCRIPTION:', result.text);

        fs.unlinkSync(audioFilePath);

        const response = {
            transcription: result.text,
            translated: translate,
            metadata: {
                fileSize: fileSize,
                processingTimeMs: processingTime,
                fileName: req.file.originalname,
                mode: translate ? 'translation' : 'transcription'
            }
        };

        res.json(response);

    } catch (error) {
        console.error('❌ Processing error:', error);

        if (audioFilePath && fs.existsSync(audioFilePath)) {
            try {
                fs.unlinkSync(audioFilePath);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }

        if (error.code === 'ENOENT') {
            res.status(500).json({
                error: 'File processing error',
                message: 'Could not read the uploaded audio file'
            });
        } else if (error.status === 401) {
            res.status(500).json({
                error: 'Authentication error',
                message: 'Invalid Azure OpenAI credentials'
            });
        } else if (error.status === 404) {
            res.status(500).json({
                error: 'Deployment not found',
                message: `Azure OpenAI deployment "${deploymentName}" not found`
            });
        } else {
            res.status(500).json({
                error: 'Processing failed',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n✅ Server is running!`);
    console.log(`   🌐 Open in browser: http://localhost:${PORT}`);
    console.log(`   📝 Transcription endpoint: http://localhost:${PORT}/transcribe`);
    console.log(`   🌍 Translation: Enabled by default (set translate=false to disable)`);
    console.log(`   ❤️  Health check: http://localhost:${PORT}/health\n`);
});
