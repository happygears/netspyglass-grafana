import { DataSource } from 'datasource';
import { Dictionary } from 'lodash';
import { useEffect, useState } from 'react';
import { ZSVariable } from 'services/nsgql/response-models';

type AsyncVariablesState = {
  loading: boolean;
  variables: null | Dictionary<ZSVariable[]>;
  error: Error | null;
};

export function useLoadVariables(datasource: DataSource): AsyncVariablesState {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<AsyncVariablesState['variables']>(null);

  useEffect(() => {
    setLoading(true);
    datasource
      .getNSGVariables()
      .then((reslut) => setVariables(reslut))
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  }, [datasource]);

  return {
    variables,
    loading,
    error,
  };
}
