import { DataSource } from 'datasource';
import { useEffect, useState } from 'react';

type AsyncSuggestionsState = {
  loading: boolean;
  suggestions: null | any[];
  error: Error | null;
};

export function useLoadSuggestions(variable: string, datasource: DataSource): AsyncSuggestionsState {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AsyncSuggestionsState['suggestions']>(null);

  useEffect(() => {
    setLoading(true);
    datasource
      .getSuggestions(variable, 'device')
      .then((reslut) => setSuggestions(reslut))
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  }, [variable, datasource]);

  return {
    suggestions,
    loading,
    error,
  };
}
