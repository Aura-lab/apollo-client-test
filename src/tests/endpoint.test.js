const { GraphQLClient, gql } = require('graphql-request');

const graphQLClient = new GraphQLClient('https://w6tcrg3sb4.execute-api.us-east-1.amazonaws.com/example-example-graphql-api', {
  headers: {
    authorization: '5152fa08-1806-4514-9f66-730e9b59486e',
  },
})

const userQuery = gql`
  {
   me {
    id
    email
    firstName
    lastName
    createdAt
    updatedAt
    memberships {
      role {
        id
        __typename
        ... on AdminRole {
          admin
        }
        ... on UserRole {
          admin
          write
        }
      }
      organisation {
        id
        name
        timezone
      }
    }  
  }
}
`;

const createUser = gql`mutation createUser($user: UserInput!) {
  createUser(user: $user) {
    id
    email
    firstName
    lastName
    createdAt
    updatedAt
    memberships {
      role {
        id
        __typename
      }
      organisation {
        name
      }
    }  
  }
}`;

const createOrg = gql`mutation createOrganisation($name: String!, $timezone: Timezone!) {
  createOrganisation(name: $name, timezone: $timezone) {
    id
    name
    createdAt
    updatedAt
    boards {
      name
    }
  }
}`;

const updateOrg = gql`mutation updateOrganisation($organisationId: ID!, $organisationInput: OrganisationInput!) {
  updateOrganisation(organisationId: $organisationId, organisationInput: $organisationInput) {
    id
    name
    createdAt
    updatedAt
    boards {
      name
    }
  }
}`;

const queryOrg = gql`query organisation($organisationId: ID!) {
  organisation(organisationId: $organisationId) {
    id
    name
    timezone
    createdAt
    updatedAt
    boards {
      id
      name
    }
  }
}`;

const upsertBoard = gql`mutation putBoard($organisationId: ID!, $boardId: ID, $input: BoardInput!) {
  putBoard(organisationId: $organisationId, boardId: $boardId, input: $input) {
    id
    name
    createdAt
    updatedAt
    tickets {
      name
      description
      status
    }  
  }
}`;

const queryBoard = gql`query board($organisationId: ID!, $boardId: ID!) {
  board(organisationId: $organisationId, boardId: $boardId) {
    id
    name
    createdAt
    updatedAt
    tickets {
      name
      description
      status
    }  
  }
}`;

const putTicket = gql`
mutation putTicket($organisationId: ID!, $boardId: ID!, $ticketId: ID $input: TicketInput!) {
  putTicket(organisationId: $organisationId, boardId: $boardId, ticketId: $ticketId, input: $input) {
    id
    name
    description
    status
    visible
  }
}
`;

const queryTicket = gql`query ticket($organisationId: ID!, $ticketId: ID!) {
  ticket(organisationId: $organisationId, ticketId: $ticketId) {
    id
    name
    description
    status
    visible
    board {
      name
    }
  }
}`;

const deleteTicket = gql`mutation deleteTicket($organisationId: ID!, $ticketId: ID!) {
  deleteTicket(organisationId: $organisationId, ticketId: $ticketId) {
    id
    name
    description
    status
    visible
  }
}`;

let orgId = null;
let boardId = null;

describe('User test', () => {
  it('Should receive user data', async () => {
    const result = await graphQLClient.request(userQuery);
    expect(result.me).toBeTruthy();
  });
  
  it('Should create user successfully', async () => {
    const userInput = {
      user: {
        firstName: "John",
        lastName: "Dory",
        email: "john@example.com"
      }
    }
    const result = await graphQLClient.request(createUser, userInput);
    expect(result.createUser).toBeTruthy();
    expect(result.createUser.email).toBe(userInput.user.email);
    expect(result.createUser.firstName).toBe(userInput.user.firstName);
    expect(result.createUser.lastName).toBe(userInput.user.lastName);
  })
});

describe('Organisation test', () => {
  const orgCreateInput = {
    name: "example",
    timezone: "Pacific/Auckland"
  }
  const orgUpdateInput = {
    organisationInput: {
      name: "example update"
    }
  };

  it('Should create organisation successfully', async () => { 
    const result = await graphQLClient.request(createOrg, orgCreateInput);
    expect(result.createOrganisation).toBeTruthy();
    expect(result.createOrganisation.name).toBe(orgCreateInput.name);
    orgId = result.createOrganisation.id;
  })
  
  it('Should update organisation successfully', async () => {
    const result = await graphQLClient.request(updateOrg, { ...orgUpdateInput, organisationId: orgId });
    expect(result.updateOrganisation).toBeTruthy();
    expect(result.updateOrganisation.name).toBe(orgUpdateInput.organisationInput.name);
  })

  it('Should retrieve organisation by supplied orgId', async () => {
    const result = await graphQLClient.request(queryOrg, {organisationId: orgId});
    expect(result.organisation).toBeTruthy();
    expect(result.organisation.name).toBe(orgUpdateInput.organisationInput.name);
    expect(result.organisation.timezone).toBe(orgCreateInput.timezone);
  })
})

describe('Board test', () => {
  
  const boardCreateInput = { 
    name: 'example board'
  };
  const boardUpdateInput = {
    name: 'Sample board'
  }
  it('Should create board successfully', async () => {
    const result = await graphQLClient.request(upsertBoard, {organisationId: orgId, input: boardCreateInput});
    expect(result.putBoard).toBeTruthy();
    expect(result.putBoard.name).toBe(boardCreateInput.name);
    boardId = result.putBoard.id;
  });
  it('Should update board successfully', async () => {
    const result = await graphQLClient.request(upsertBoard, {organisationId: orgId, input: boardUpdateInput, boardId});
    expect(result.putBoard).toBeTruthy();
    expect(result.putBoard.name).toBe(boardUpdateInput.name);
  });
  it('Should able to query board by boardId', async ()=> {
    const result = await graphQLClient.request(queryBoard, {organisationId: orgId, boardId});
    expect(result.board).toBeTruthy();
    expect(result.board.name).toBe(boardUpdateInput.name);
  });
  it('Organisation should include new created board', async () => {
    const result = await graphQLClient.request(queryOrg, {organisationId: orgId});
    expect(result.organisation).toBeTruthy();
    expect(result.organisation.boards).toHaveLength(1);
    expect(result.organisation.boards[0]).toEqual({ id: boardId, name: boardUpdateInput.name });
  })
});

describe('Ticket test', () => {
  let ticketId = null;
  const createTicketInput = {
    name: "first ticket",
    description: "implement UI for example",
    status: "TODO",
    visible: true
  };
  const updateTicketInput = {
    name: '1st Ticket',
    status: "TODO",
    visible: false
  };
  it('Should create ticket successfully', async () => {
    const result = await graphQLClient.request(putTicket, {organisationId: orgId, boardId, input: createTicketInput});
    expect(result.putTicket).toBeTruthy();
    expect(result.putTicket.name).toBe(createTicketInput.name);
    expect(result.putTicket.description).toBe(createTicketInput.description);
    expect(result.putTicket.status).toBe(createTicketInput.status);
    expect(result.putTicket.visible).toBe(createTicketInput.visible);
    ticketId = result.putTicket.id;
  });

  it('Should update ticket successfully', async () => {
    const result = await graphQLClient.request(putTicket, {organisationId: orgId, boardId, ticketId, input: updateTicketInput});
    expect(result.putTicket).toBeTruthy();
    expect(result.putTicket.name).toBe(updateTicketInput.name);
    expect(result.putTicket.status).toBe(updateTicketInput.status);
    expect(result.putTicket.visible).toBe(updateTicketInput.visible);
  })

  it('Should be able to query ticket by ticketId', async () => {
    const result = await graphQLClient.request(queryTicket, {organisationId: orgId, ticketId});
    expect(result.ticket).toBeTruthy();
    expect(result.ticket.name).toBe(updateTicketInput.name);
    expect(result.ticket.visible).toBe(updateTicketInput.visible);
    expect(result.ticket.status).toBe(updateTicketInput.status);
    expect(result.ticket.description).toBe(createTicketInput.description);
  });

  it('Should successfully delete ticket by ticketId', async () => {
    const deleteResult = await graphQLClient.request(deleteTicket, {organisationId: orgId, ticketId});
    expect(deleteResult.deleteTicket).toBeTruthy();
    const result = await graphQLClient.request(queryTicket, {organisationId: orgId, ticketId});
    expect(result.ticket).toBeFalsy();
  });
})
