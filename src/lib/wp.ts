const WP_GRAPHQL_ENDPOINT = import.meta.env.WP_GRAPHQL_ENDPOINT;

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export async function wpQuery<T>(
  query: string,
  variables: Record<string, any> = {},
): Promise<T> {
  const res = await fetch(WP_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    console.error(json.errors);
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }
  return json.data;
}
