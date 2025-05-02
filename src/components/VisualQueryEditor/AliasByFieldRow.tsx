import { SegmentSection, InlineField, Input, InlineLabel, Tooltip, Icon, useStyles2 } from '@grafana/ui';
import { QueryPlaceholders, QueryHints } from 'dictionary';
import React from 'react';
import { getSharedStyles, noRightMargin } from './sharedStyles';

interface Props {
  onChange: (value: string) => void;
  onRunQuery: () => void;
  alias: string;
}

export function AliasByFieldRow({ alias, onChange, onRunQuery }: Props) {
  const styles = useStyles2(getSharedStyles);
  return (
    <SegmentSection label="ALIAS BY" fill={false}>
      <InlineField grow={true}>
        <Input
          value={alias}
          placeholder={QueryPlaceholders.alias}
          onInput={(event) => onChange((event.target as HTMLInputElement).value)}
          onKeyUp={(event) => event.key === 'Enter' && onRunQuery()}
        />
      </InlineField>
      <InlineField className={styles.inlineField}>
        <InlineLabel className={noRightMargin}>
          <Tooltip content={QueryHints.alias} placement="top-end">
            <Icon name="question-circle" />
          </Tooltip>
        </InlineLabel>
      </InlineField>
    </SegmentSection>
  );
}
