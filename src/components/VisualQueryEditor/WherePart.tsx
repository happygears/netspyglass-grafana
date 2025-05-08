import { Button, IconButton, InlineLabel, Input, Tooltip, useStyles2 } from '@grafana/ui';
import { DropdownSegment, DropdownSegmentOption } from './DropdownSegment';
import { QueryHints } from 'dictionary';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Operators } from 'services/nsgql';
import { noRightMargin } from './sharedStyles';
import { css, cx } from '@emotion/css';
import { CascaderSegment } from './CascaderSegment';
import { ListOptionTree } from './types';
import { ZSTargetTag } from 'types';

const OPERATORS_LIST = [
  { label: Operators.EQ, value: Operators.EQ },
  { label: Operators.NOT_EQ, value: Operators.NOT_EQ },
  { label: Operators.NOT_EQ2, value: Operators.NOT_EQ2 },
  { label: Operators.LT, value: Operators.LT },
  { label: Operators.GT, value: Operators.GT },
  { label: Operators.REGEXP, value: Operators.REGEXP },
  // { label: Operators.NOT_REGEXP, value: Operators.NOT_REGEXP },
  { label: Operators.IS_NULL, value: Operators.IS_NULL },
  { label: Operators.NOT_NULL, value: Operators.NOT_NULL },
];

const CONDITION_LIST = [
  { label: Operators.AND, value: Operators.AND },
  { label: Operators.OR, value: Operators.OR },
];

function getLocalStyles(theme: GrafanaTheme2) {
  return {
    wherePartMain: css({
      display: 'flex',
      gap: theme.spacing(1),
    }),

    condButton: css({
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      color: theme.colors.primary.text,
    }),

    activeText: css({
      display: 'inline-block',
      cursor: 'pointer',
      '&:hover': {
        color: theme.colors.text.maxContrast,
      },
    }),
  };
}

export interface WherePartProps {
  tag: ZSTargetTag;
  options: ListOptionTree[];
  showConditionButton?: boolean;
  loadSuggestions: (key: string) => Promise<ListOptionTree[]>;
  onRemove: (tag: ZSTargetTag) => void;
  onChange: (tag: ZSTargetTag) => void;
}

const regexpsTypes = [Operators.REGEXP, Operators.NOT_REGEXP];
const nullTypes = [Operators.IS_NULL, Operators.NOT_NULL];

export function WherePart({
  tag,
  options,
  showConditionButton = false,
  loadSuggestions,
  onChange,
  onRemove,
}: WherePartProps) {
  const showValueChunk = !nullTypes.includes(tag.operator as Operators);
  const showRegexChunk = regexpsTypes.includes(tag.operator as Operators);
  const showCascaderChunk = !showRegexChunk;

  const localStyles = useStyles2(getLocalStyles);
  const [tagOptions, setTagOptions] = useState<ListOptionTree[]>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [regexValue, setRegexValue] = useState(showRegexChunk && tag.value ? (tag.value as string) : '');

  function handleTagValueLabelClick(tag: ZSTargetTag) {
    setShowLoader(true);
    loadSuggestions(tag.key)
      .then((data) => setTagOptions(data))
      .finally(() => setShowLoader(false));
  }

  function handleRegexSubmit() {
    console.log('handleRegexSubmit');
    console.log(regexValue, tag.value);

    if (regexValue !== tag.value) {
      onChange({ ...tag, value: regexValue.trim() });
    }
  }

  const handleOperatorChange = function (event: DropdownSegmentOption<Operators | '=~' | '!~'>): void {
    const nextValue = { ...tag, operator: event.value! };

    // If type of operator changed
    if (
      regexpsTypes.includes(tag.operator as any) !== regexpsTypes.includes(event.value as any) ||
      nullTypes.includes(tag.operator as any) !== nullTypes.includes(event.value as any)
    ) {
      nextValue.value = '';
    }

    return onChange(nextValue);
  };

  return (
    <>
      {showConditionButton && (
        <DropdownSegment
          placement="auto"
          selected={tag.operator}
          onSelect={(event) => onChange({ ...tag, condition: event.value! })}
          options={CONDITION_LIST}
        >
          <Button className={localStyles.condButton} type="button" variant="secondary">
            {tag.condition}
          </Button>
        </DropdownSegment>
      )}
      <InlineLabel className={cx(noRightMargin, localStyles.wherePartMain)} width={'auto'} as={'div'}>
        <CascaderSegment options={options} onSelect={(event) => onChange({ ...tag, key: event })}>
          <span className={localStyles.activeText}>{tag.key}</span>
        </CascaderSegment>

        <DropdownSegment
          placement="auto"
          selected={tag.operator}
          onSelect={handleOperatorChange}
          options={OPERATORS_LIST}
        >
          <Button tooltip={'Change Operator'} size="sm" variant="secondary">
            {tag.operator}
          </Button>
        </DropdownSegment>

        {showValueChunk && (
          <>
            {showRegexChunk && (
              <Tooltip content={QueryHints.regex} placement="top" theme="info-alt" interactive={true}>
                <Input
                  {...{ size: Math.max(5, regexValue.length + 3) }}
                  value={regexValue}
                  onChange={(event) => setRegexValue((event.target as HTMLInputElement).value)}
                  onKeyDownCapture={(event) => event.key === 'Enter' && handleRegexSubmit()}
                  onBlurCapture={handleRegexSubmit}
                  maxLength={50}
                  placeholder={'^.*$'}
                />
              </Tooltip>
            )}
            {showCascaderChunk && (
              <CascaderSegment
                onSelect={(event) => onChange({ ...tag, value: event })}
                onLabelClick={() => handleTagValueLabelClick(tag)}
                loading={showLoader}
                allowCustomValue={true}
                options={tagOptions}
              >
                <span className={localStyles.activeText}>{tag.value as string}</span>
              </CascaderSegment>
            )}
          </>
        )}

        <IconButton className={noRightMargin} tooltip="Remove section" name="trash-alt" onClick={() => onRemove(tag)} />
      </InlineLabel>
    </>
  );
}
