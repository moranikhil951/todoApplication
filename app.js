const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
dbPath = path.join(__dirname, "todoApplication.db");
db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
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
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getApplicationQuery = `
    SELECT * 
    FROM 
    todo
    WHERE 
    id = ${todoId};
    `;
  const application = await db.get(getApplicationQuery);
  response.send(application);
});
app.post("/todos/", async (request, response) => {
  const applicationDetails = request.body;
  const { id, todo, priority, status } = applicationDetails;
  const addApplicationQuery = ` 
    INSERT INTO
    todo 
    (id,todo,priority,status)
    VALUES (
    ${id},
    '${todo}',
    '${priority}',
    '${status}'


    )
    `;
  const dbResponse = await db.run(addApplicationQuery);
  const AppId = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  valueColumn = "";
  const requestDetails = request.body;
  switch (true) {
    case requestDetails.status !== undefined:
      valueColumn = "Status";
      break;
    case requestDetails.priority !== undefined:
      valueColumn = "Priority";
      break;
    case requestDetails.todo !== undefined:
      valueColumn = "Todo";
      break;
  }
  const previousQuery = `
  select * from 
  todo where 
  id = ${todoId} ;
  
  `;
  const previousTodo = await db.get(previousQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = request.body;

  const updateDetailsQuery = `
    UPDATE todo 
    SET 
    status = '${status}',
    todo = '${todo}',
    priority = '${priority}'
    `;
  await db.run(updateDetailsQuery);
  response.send(`${valueColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const DeleteAppQuery = `
    DELETE FROM todo 
    WHERE 
    id = ${todoId};
        `;
  await db.run(DeleteAppQuery);
  response.send("Todo Deleted");
});

module.exports = app;
