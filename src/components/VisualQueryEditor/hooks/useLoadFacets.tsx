import { DataSource } from 'datasource';
import { QueryPrompts } from 'dictionary';
import { useAsync } from 'react-use';

type AsyncFacetsState = {
  loading: boolean;
  tagsFacets: string[];
  error: Error | undefined;
};

export function useLoadTagsFacets(variable: string, datasource: DataSource): AsyncFacetsState {
  const result = useAsync(async () => {
    if (variable === QueryPrompts.variable) {
      return Promise.resolve([]);
    }

    return await datasource.getTagsFacets(variable);
  }, [datasource, variable]);

  return {
    loading: result.loading,
    tagsFacets: result.value ?? [],
    error: result.error,
  };
}
