import React, { ChangeEvent, useState } from 'react';
import { InlineField, InlineFieldRow, TextArea } from '@grafana/ui';

import type { EditorProps } from './types';
import { getDefaultTarget } from 'services/utils';
import { QueryEditorModeSwitcher } from './QueryEditorModeSwitcher';
import { AliasByFieldRow } from './AliasByFieldRow';
import { FormatAsFieldRow } from 'components/VisualQueryEditor/FormatAsFieldRow';

export function RawQueryEditor({ query, onChange, onRunQuery, datasource }: EditorProps) {
  const nsgTarget = query._nsgTarget || getDefaultTarget({ limit: 100 });
  const [nsgqlString, setNsgqlString] = useState(nsgTarget.nsgqlString);

  function handleModeChange() {
    onChange({ ...query, _nsgTarget: { ...nsgTarget, rawQuery: 0, nsgqlString } });
  }

  function handleQueryChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setNsgqlString(event.target.value);
  }

  function handleBlur() {
    if (nsgTarget.nsgqlString !== nsgqlString) {
      onChange({ ...query, _nsgTarget: { ...nsgTarget, nsgqlString } });
    }
  }

  function handleAliasChange(alias: string) {
    if (nsgTarget.alias !== alias) {
      onChange({ ...query, _nsgTarget: { ...nsgTarget, alias } });
    }
  }

  function handleFormatChange(format: string) {
    if (nsgTarget.format !== format) {
      onChange({ ...query, _nsgTarget: { ...nsgTarget, format } });
    }
  }

  return (
    <div>
      <InlineFieldRow>
        <InlineField grow={true}>
          <TextArea value={nsgqlString} onChange={handleQueryChange} onBlur={handleBlur} />
        </InlineField>
        <QueryEditorModeSwitcher rawMode={true} onChange={handleModeChange} />
      </InlineFieldRow>
      <FormatAsFieldRow value={nsgTarget.format} onChange={handleFormatChange} />
      <AliasByFieldRow alias={nsgTarget.alias} onChange={handleAliasChange} onRunQuery={onRunQuery} />
    </div>
  );
}
