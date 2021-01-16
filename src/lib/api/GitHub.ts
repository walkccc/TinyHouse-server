import fetch from 'node-fetch';

interface GitHubCredentials {
  client_id: string;
  client_secret: string;
  code: string;
}

interface GitHubToken {
  access_token: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

// only take fields we need
interface GitHubUserResponse {
  id: number;
  node_id: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

interface GitHubLoginResponse {
  githubUser: {
    _id: string;
    avatar_url: string;
    name: string;
    email: string;
  };
}

const getGitHubAccessToken = async (credentials: GitHubCredentials): Promise<GitHubToken> => {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  const json: GitHubTokenResponse = await res.json();

  return { access_token: json.access_token };
};

const getUserData = async (token: string) => {
  const res = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const json: GitHubUserResponse = await res.json();
  const { id, node_id, avatar_url, name, email } = json;

  return { data: { _id: `${id}+${node_id}`, avatar_url, name: name ?? '', email: email ?? '' } };
};

export const GitHub = {
  authUrl: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user`,
  logIn: async (code: string): Promise<GitHubLoginResponse> => {
    // construct the GitHub credentials
    const credentials: GitHubCredentials = {
      client_id: process.env.GITHUB_CLIENT_ID as string,
      client_secret: process.env.GITHUB_CLIENT_SECRET as string,
      code,
    };

    // use the credentials we constructed to get the `access_token` of GitHub
    const { access_token } = await getGitHubAccessToken(credentials);

    // use the `access_token` we got from GitHub to communicate with the GitHub
    // API and get the data of the logged in user
    const { data } = await getUserData(access_token);

    return { githubUser: data };
  },
};
