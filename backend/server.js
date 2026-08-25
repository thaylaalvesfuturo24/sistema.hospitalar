const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  const conteudo = fs.readFileSync(DB_FILE, "utf8").trim();

  if (!conteudo) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  const db = JSON.parse(conteudo);

  if (!Array.isArray(db.usuarios)) db.usuarios = [];
  if (!Array.isArray(db.pacientes)) db.pacientes = [];
  if (!Array.isArray(db.triagens)) db.triagens = [];
  if (!Array.isArray(db.consultas)) db.consultas = [];
  if (!Array.isArray(db.tv_historico)) db.tv_historico = [];

  if (!("tv_chamada" in db)) {
    db.tv_chamada = null;
  }

  return db;
}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}


// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {
  try {
    const db = readDB();

    const usuario = String(req.body.usuario || "").trim();
    const senha = String(req.body.senha || "");

    const user = db.usuarios.find(
      u =>
        u.usuario === usuario &&
        u.senha === senha
    );

    if (!user) {
      return res.status(401).json({
        erro: "Login inválido"
      });
    }

    return res.json(user);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: error.message
    });
  }
});


// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {
  try {
    const db = readDB();

    const nome = String(req.body.nome || "").trim();
    const cpf = String(req.body.cpf || "").trim();
    const tipo = String(req.body.tipo || "Convenio").trim();

    if (!nome) {
      return res.status(400).json({
        erro: "Informe o nome do paciente."
      });
    }

    const paciente = {
      id: Date.now(),
      nome: nome,
      cpf: cpf,
      tipo: tipo,
      status: "triagem",
      createdAt: new Date().toISOString()
    };

    db.pacientes.push(paciente);

    writeDB(db);

    return res.status(201).json(paciente);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: error.message
    });
  }
});


app.get("/pacientes", (req, res) => {
  try {
    const db = readDB();

    return res.json(db.pacientes);

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
});


// ===============================
// TRIAGEM
// ===============================

app.post("/triagem", (req, res) => {
  try {
    const db = readDB();

    const nome = String(req.body.nome || "").trim();
    const sintoma = String(req.body.sintoma || "").trim();
    const temperatura = Number(req.body.temperatura || 0);
    const alergia = String(req.body.alergia || "").trim();
    const observacao = String(req.body.observacao || "").trim();

    if (!nome) {
      return res.status(400).json({
        erro: "Informe o nome do paciente."
      });
    }

    let risco = req.body.risco;

    if (temperatura >= 39) {
      risco = "vermelho";
    } else if (temperatura >= 38) {
      risco = "amarelo";
    } else if (!risco) {
      risco = "verde";
    }

    const triagem = {
      id: Date.now(),
      nome: nome,
      sintoma: sintoma,
      temperatura: temperatura,
      alergia: alergia,
      observacao: observacao,
      risco: risco,
      status: "aguardando_medico",
      createdAt: new Date().toISOString()
    };

    db.triagens.push(triagem);

    writeDB(db);

    return res.status(201).json(triagem);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: error.message
    });
  }
});


app.get("/triagens", (req, res) => {
  try {
    const db = readDB();

    return res.json(db.triagens);

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
});


// ===============================
// TV
// ===============================

app.post("/tv/chamar", (req, res) => {
  try {
    const db = readDB();

    const paciente = String(req.body.paciente || "").trim();
    const localTipo = String(
      req.body.localTipo || "GUICHÊ"
    ).trim();

    const localNumero = String(
      req.body.localNumero || "01"
    ).trim();

    if (!paciente) {
      return res.status(400).json({
        erro: "Paciente não informado."
      });
    }

    const chamada = {
      id: Date.now().toString(),
      localTipo: localTipo,
      localNumero: localNumero,
      paciente: paciente,
      hora: new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    };

    db.tv_chamada = chamada;

    db.tv_historico.unshift(chamada);

    if (db.tv_historico.length > 5) {
      db.tv_historico =
        db.tv_historico.slice(0, 5);
    }

    writeDB(db);

    return res.json(chamada);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: error.message
    });
  }
});


app.get("/tv/chamada", (req, res) => {
  try {
    const db = readDB();

    return res.json({
      chamada: db.tv_chamada,
      historico: db.tv_historico
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
});


// ===============================
// LISTA DE MEDICAÇÕES
// ===============================

app.get("/lista-medicacoes", (req, res) => {

  return res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);

});


// ===============================
// CONSULTA
// ===============================

app.post("/consulta", (req, res) => {

  try {

    console.log("=================================");
    console.log("📥 RECEBENDO CONSULTA");
    console.log(req.body);
    console.log("=================================");

    const db = readDB();

    if (!Array.isArray(db.consultas)) {
      db.consultas = [];
    }

    const paciente =
      String(req.body.paciente || "").trim();

    const diagnostico =
      String(req.body.diagnostico || "").trim();

    const medicacao =
      String(req.body.medicacao || "").trim();

    const obs =
      String(req.body.obs || "").trim();


    if (!paciente) {

      return res.status(400).json({
        erro: "Paciente não informado."
      });

    }


    if (!medicacao) {

      return res.status(400).json({
        erro: "Medicação não informada."
      });

    }


    const consulta = {

      id: Date.now(),

      paciente: paciente,

      diagnostico: diagnostico,

      medicacao: medicacao,

      obs: obs,

      createdAt:
        new Date().toISOString()

    };


    db.consultas.push(consulta);

    writeDB(db);


    console.log("✅ CONSULTA SALVA!");
    console.log(consulta);


    return res.status(201).json(consulta);


  } catch (error) {

    console.error(
      "❌ ERRO AO SALVAR CONSULTA:"
    );

    console.error(error);


    return res.status(500).json({

      erro:
        error.message ||
        "Erro interno ao salvar consulta."

    });

  }

});


// ===============================
// MEDICAÇÕES PRESCRITAS
// ===============================

app.get("/medicacoes", (req, res) => {

  try {

    const db = readDB();

    return res.json(
      db.consultas
    );

  } catch (error) {

    return res.status(500).json({
      erro: error.message
    });

  }

});


// ===============================
// ROTA NÃO ENCONTRADA
// ===============================

app.use((req, res) => {

  return res.status(404).json({

    erro:
      "Rota não encontrada: " +
      req.method +
      " " +
      req.originalUrl

  });

});


// ===============================
// ERRO GLOBAL
// ===============================

app.use((err, req, res, next) => {

  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({

    erro:
      err.message ||
      "Erro interno do servidor."

  });

});


// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, () => {

  console.log(
    "🏥 Hospital Pro rodando em http://localhost:" +
    PORT
  );

});