const { request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

/* 
Response.Route/Query/Body
Route Params = identificar um parametro na rota, serve pra editar/deletar/buscar
Query Params = Paginação/filtro, sao parametros após a ? na url
Body Params = Corpo da Requisição

*/

const app = express();
app.use(express.json());

const fakeBD = [];

//Middleware

function verifyIfExistsAccountEmail(request, response, next) {
  const { email } = request.headers;

  const user = fakeBD.find((user) => user.email === email);

  if (!user) {
    return response.status(400).json({ error: "Usuário não encontrado" });
  }

  request.user = user;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "deposit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { email, name } = request.body;

  const userAlreadyExists = fakeBD.some((account) => account.email === email);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "Email já Cadastrado" });
  }

  fakeBD.push({
    email,
    name,
    id: uuidv4(),
    statement: [],
    total_money: 0,
  });

  return response.status(201).send();
});

app.use(verifyIfExistsAccountEmail);

app.get("/statement", (request, response) => {
  const { user } = request;
  return response.json(user.statement);
});

app.post("/task", (request, response) => {
  const { description, amount, type } = request.body;
  const { user } = request;
  const balance = getBalance(user.statement);

  if (balance < amount) {
    return response
      .status(400)
      .json({ error: "Saldo insuficiente, impossível registrar a operação" });
  }

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type,
  };

  user.statement.push(statementOperation);

  user.total_money = balance;

  return response.status(201).send();
});

app.listen(3333);
