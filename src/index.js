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

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const user = fakeBD.find((user) => user.cpf === cpf);

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
  const { email, name, cpf, total_money } = request.body;

  const userAlreadyExists = fakeBD.some((account) => account.cpf === cpf);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "CPF já Cadastrado" });
  }

  fakeBD.push({
    email,
    name,
    cpf,
    id: uuidv4(),
    statement: [],
    total_money,
  });

  return response.status(201).send();
});

app.use(verifyIfExistsAccountCPF);

app.get("/statement", (request, response) => {
  const { user } = request;
  return response.json(user.statement);
});

app.post("/task", (request, response) => {
  const { description, amount, type } = request.body;
  const { user } = request;

  if (type === "withdraw" && user.total_money < amount) {
    return response
      .status(400)
      .json({ error: "Saldo insuficiente, impossível registrar a operação" });
  }

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type,
    id: uuidv4(),
  };

  user.statement.push(statementOperation);

  const balance = getBalance(user.statement);
  user.total_money = balance;

  return response.status(201).send();
});

app.get("/task/:id", (request, response) => {
  const { user } = request;
  const idTask = request.params.id;

  const task = user.statement.find((transaction) => transaction.id === idTask);

  return response.status(200).json(task);
});

app.put("/task/:id", (request, response) => {
  const { user } = request;
  const { description, amount, type } = request.body;
  const idTask = request.params.id;

  if (type === "withdraw" && user.total_money < amount) {
    return response.status(400).json({
      error: "Saldo insuficiente, não é possivel ficar com saldo negativo",
    });
  }

  user.statement.map((transaction) => {
    if (transaction.id === idTask) {
      transaction.description = description;
      transaction.amount = amount;
      transaction.type = type;
    }
  });
  const balance = getBalance(user.statement);
  user.total_money = balance;

  return response.status(201).send();
});

app.delete("/task/:id", (request, response) => {
  const { user } = request;
  const idTask = request.params.id;

  let taskDeleted = user.statement.find((task) => task.id === idTask);
  console.log(taskDeleted);

  if (!taskDeleted) {
    return response.status(400).json({ error: "Transação não encontrada" });
  }

  user.statement.splice(taskDeleted, 1);

  const balance = getBalance(user.statement);
  user.total_money = balance;

  return response.status(200).json(user.statement);
});

app.put("/account", (request, response) => {
  const { name, email } = request.body;
  const { user } = request;

  user.name = name;
  user.email = email;

  return response.status(201).send();
});

app.get("/account", (request, response) => {
  const { user } = request;

  return response.status(200).json(user);
});

app.delete("/account", (request, response) => {
  const { user } = request;

  fakeBD.splice(user, 1);

  return response.status(200).json(fakeBD);
});
app.listen(3333);
