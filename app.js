const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost/:3000/")
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (queryObject) => {
  return queryObject.priority !== undefined && queryObject.status !== undefined;
};

const hasPriorityProperty = (queryObject) => {
  return queryObject.priority !== undefined;
};
const hasStatusProperty = (queryObject) => {
  return queryObject.status !== undefined;
};

// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

// api 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT 
    * 
    FROM 
    todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);

  response.send(todo);
});

//api 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createTodoQuery = `
    INSERT INTO todo (id,todo,priority,status)
    VALUES (${id},'${todo}', '${priority}','${status}')`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//api 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT 
  * 
  FROM 
  todo 
  WHERE id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE 
  todo 
  SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE 
  id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//api 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM 
    todo 
    WHERE 
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
