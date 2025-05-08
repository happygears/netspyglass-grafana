import { IconButton, InlineField, InlineFieldRow, Stack, useStyles2 } from '@grafana/ui';
import { ZSTarget, ZSTargetTag } from 'types';
import React from 'react';
import { Operators } from 'services/nsgql';
import { CascaderSegment } from './CascaderSegment';
import { getSharedStyles, noRightMargin } from './sharedStyles';

import type { DataSource } from 'datasource';
import { WherePart } from './WherePart';
import { ListOptionTree } from './types';
import { QueryPrompts } from 'dictionary';
interface Props<T> {
  onChange: (value: T) => void;
  value: T;
  variable: string;
  datasource: DataSource;
  options: ListOptionTree[];
}

export function WhereSection({ variable, value, options, datasource, onChange }: Props<ZSTarget['tags']>) {
  const sharedStyles = useStyles2(getSharedStyles);

  function handleAddTag(tag: string) {
    onChange(
      value.concat([
        {
          key: tag,
          condition: value.length > 0 ? Operators.AND : '',
          operator: Operators.EQ,
          value: QueryPrompts.whereValue,
        },
      ])
    );
  }

  function handleDeleteTag(index: number) {
    const updateValue = [...value];
    updateValue.splice(index, 1);
    onChange(updateValue);
  }

  function handleChangeTag(newTag: ZSTargetTag, index: number) {
    const updateValue = [...value];
    updateValue.splice(index, 1, newTag);
    onChange(updateValue);
  }

  function handleLoadSuggestions(key: string) {
    return datasource.getSuggestions(variable, key).then((list) => list.map((item) => ({ label: item, value: item })));
  }

  const segments = value.map((tag, index) => (
    <WherePart
      key={`${index}_${tag.key}_${tag.operator}_${tag.value}_${tag.condition}`}
      tag={tag}
      options={options}
      showConditionButton={index > 0}
      loadSuggestions={handleLoadSuggestions}
      onRemove={() => handleDeleteTag(index)}
      onChange={(tag) => handleChangeTag(tag, index)}
    />
  ));

  return (
    <InlineFieldRow>
      <InlineField className={sharedStyles.inlineField} grow={true} shrink={true} label="WHERE" labelWidth={12}>
        <Stack direction={'row'} gap={0.5} wrap={'wrap'}>
          {segments}
          <CascaderSegment options={options} onSelect={handleAddTag}>
            <div className="gf-form-label">
              <IconButton className={noRightMargin} tooltip="Add Criteria" name="plus" size="lg" variant="secondary" />
            </div>
          </CascaderSegment>
        </Stack>
      </InlineField>
    </InlineFieldRow>
  );
}
