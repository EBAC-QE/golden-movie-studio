export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder ao preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Lidar apenas com POST para cadastro
  if (req.method === 'POST') {
    try {
      const { nome, sobrenome, email, telefone, senha } = req.body;
      
      // Validações básicas
      if (!nome || !sobrenome || !email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Por favor, preencha todos os campos obrigatórios.'
        });
      }

      // Validar formato do email
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'O formato do email é inválido.'
        });
      }

      // ============================================
      // OPÇÕES DE ARMAZENAMENTO DE DADOS:
      // ============================================
      
      // OPÇÃO 1: Banco de dados gratuito (Recomendado para produção)
      // Você pode usar:
      // - Vercel Postgres (gratuito até certo limite)
      // - MongoDB Atlas (gratuito 512MB)
      // - Supabase (gratuito)
      // - PlanetScale (gratuito)
      
      // Exemplo com MongoDB Atlas:
      /*
      import { MongoClient } from 'mongodb';
      
      const uri = process.env.MONGODB_URI; // Configurar nas variáveis de ambiente da Vercel
      const client = new MongoClient(uri);
      
      await client.connect();
      const database = client.db('golden-movie');
      const usuarios = database.collection('usuarios');
      
      const result = await usuarios.insertOne({
        nome, sobrenome, email, telefone, 
        senha, // Em produção: usar bcrypt para hash
        createdAt: new Date()
      });
      
      await client.close();
      */

      // OPÇÃO 2: Armazenamento simples em JSON (apenas para testes/aulas)
      // Usando Vercel KV Storage ou um serviço externo
      
      // OPÇÃO 3: Para demonstração em aula - apenas retorna sucesso
      console.log('Dados recebidos:', { nome, sobrenome, email, telefone });
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      // Resposta de sucesso
      res.status(200).json({
        success: true,
        message: `Usuário ${nome} ${sobrenome} cadastrado com sucesso!`,
        data: {
          id: Date.now(), // ID temporário
          nome,
          sobrenome,
          email,
          telefone
        }
      });

    } catch (error) {
      console.error('Erro no cadastro:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao processar cadastro. Tente novamente.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    // Método não permitido
    res.status(405).json({ 
      success: false,
      message: `Método ${req.method} não permitido. Use POST.` 
    });
  }
}

// ============================================
// 2. MODIFICAR: script.js
// ============================================
// Atualize apenas a parte da API URL e a função registerUser:

const API_KEY = 'f7f22d30'; 
// MUDANÇA AQUI - usar /api/cadastro em produção
const localURL = 'http://localhost:3000/api/cadastro';
const productionURL = '/api/cadastro'; // Vercel roteia automaticamente para a function
const API_URL = window.location.hostname === 'localhost' ? localURL : productionURL;

// ... mantenha as outras funções como estão ...

function registerUser(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('signup-firstname').value,
        sobrenome: document.getElementById('signup-lastname').value,
        email: document.getElementById('signup-email').value,
        telefone: document.getElementById('signup-phone').value,
        senha: document.getElementById('signup-password').value
    };

    const responseDiv = document.getElementById('signup-response');
    
    // Mostrar loading
    responseDiv.textContent = 'Cadastrando...';
    responseDiv.className = 'loading';

    fetch(API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            responseDiv.textContent = data.message;
            responseDiv.className = 'success';
            
            // Limpar formulário após sucesso
            document.getElementById('signup-form').reset();
        } else {
            responseDiv.textContent = data.message;
            responseDiv.className = 'error';
        }
    })
    .catch(error => {
        console.error('Erro ao cadastrar:', error);
        responseDiv.textContent = 'Falha na conexão. Tente novamente.';
        responseDiv.className = 'error';
    });
}


// ============================================
// 4. VARIÁVEIS DE AMBIENTE (se usar banco de dados)
// ============================================
// No dashboard da Vercel:
// Settings > Environment Variables
// Adicione:
// MONGODB_URI = mongodb+srv://...
// ou
// SUPABASE_URL = https://...
// SUPABASE_KEY = ...

// ============================================
// 5. TESTAR LOCALMENTE
// ============================================
// Instale Vercel CLI: npm i -g vercel
// Na pasta do projeto: vercel dev
// Acesse: http://localhost:3000

// ============================================
// 6. DEPLOY
// ============================================
// Opção 1: Push para GitHub (deploy automático)
// Opção 2: CLI: vercel --prod