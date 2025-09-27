require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Joi = require('joi');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares básicos
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servindo arquivos estáticos
app.use(express.static('./'));

// Simulando banco de dados com arquivo JSON
const DB_FILE = 'users.json';

// Função para ler dados do arquivo
function readDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Erro ao ler banco de dados:', error);
        return [];
    }
}

// Função para escrever dados no arquivo
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao escrever no banco de dados:', error);
        return false;
    }
}

const schemaCadastro = Joi.object({
    nome: Joi.string().pattern(new RegExp('^[A-Za-zÀ-ÖØ-öø-ÿ\\s]+$')).required().messages({
        'string.base': `Nome deve ser uma string`,
        'string.empty': `Nome não pode estar vazio`,
        'string.pattern.base': `Nome deve conter apenas caracteres alfabéticos, acentuados e espaços`
    }),
    sobrenome: Joi.string().pattern(new RegExp('^[A-Za-zÀ-ÖØ-öø-ÿ\\s]+$')).required().messages({
        'string.base': `Sobrenome deve ser uma string`,
        'string.empty': `Sobrenome não pode estar vazio`,
        'string.pattern.base': `Sobrenome deve conter apenas caracteres alfabéticos, acentuados e espaços`
    }),
    email: Joi.string().email().required().messages({
        'string.email': `E-mail deve ser um email válido`,
        'string.empty': `E-mail não pode estar vazio`
    }),
    telefone: Joi.string().pattern(new RegExp('^[0-9]*$')).allow('').optional().messages({
        'string.pattern.base': `Telefone deve conter apenas números`
    }),
    senha: Joi.string().pattern(new RegExp('^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$')).required().messages({
        'string.pattern.base': `Senha deve ter pelo menos 8 caracteres, incluir uma letra maiúscula, um número e um caractere especial (!@#$&*)`,
        'string.empty': `Senha não pode estar vazia`
    })
});

app.get('/usuario/id/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const users = readDatabase();
    const user = users.find(u => u.id === id);
    
    if (user) {
        const { senha, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
    } else {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
});

app.get('/usuario/email/:email', (req, res) => {
    const email = req.params.email;
    const users = readDatabase();
    const user = users.find(u => u.email === email);
    
    if (user) {
        const { senha, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
    } else {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
});

app.post('/cadastro', async (req, res) => {
    try {
        const value = await schemaCadastro.validateAsync(req.body);
        const { nome, sobrenome, email, telefone, senha } = value;

        const users = readDatabase();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        // Criptografar a senha antes de salvar
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            nome,
            sobrenome,
            email,
            telefone,
            senha: hashedPassword
        };

        users.push(newUser);
        
        if (writeDatabase(users)) {
            res.status(200).json({ message: 'Cadastro realizado com sucesso!' });
        } else {
            res.status(500).json({ message: 'Erro ao salvar o cadastro.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: err.details[0].message });
    }
});

app.listen(PORT, () => {
    const RESET = "\x1b[0m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m"
    console.log(`${GREEN}**Servidor rodando na porta: ${PORT}${RESET}`);
    console.log(`${YELLOW}**Acesse: http://localhost:${PORT}${RESET}`);
});