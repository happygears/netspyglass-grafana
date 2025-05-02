import React, { ChangeEvent, useEffect, useId, useMemo } from 'react';
import { SelectableValue } from '@grafana/data';
import {
  Icon,
  IconButton,
  InlineField,
  InlineFieldRow,
  InlineLabel,
  InlineSwitch,
  LoadingPlaceholder,
  SegmentSection,
  Select,
  Tooltip,
  useStyles2,
} from '@grafana/ui';

import { uniqueId } from 'lodash';
import { ZSTarget } from 'types';
import { PredefinedColumns, QueryHints, QueryPrompts } from 'dictionary';
import type { EditorProps } from './types';
import { useLoadVariables } from './hooks/useLoadVariables';
import { FromFieldRow } from './FromFieldRow';
import { getSharedStyles, noRightMargin } from './sharedStyles';
import { GroupByFieldRow } from './GroupByFieldRow';
import { OrderByFieldRow } from './OrderByFieldRow';
import { WhereSection } from './WhereSection';
import { useLoadTagsFacets } from './hooks/useLoadFacets';
import { ColumnsFieldRow } from './ColumnsFieldRow';
import { getDefaultTarget, normalizeTarget } from 'services/utils';
import { UNIQ_PREFIXES } from 'services/constants';
import { QueryEditorModeSwitcher } from './QueryEditorModeSwitcher';
import { AliasByFieldRow } from './AliasByFieldRow';
import { FormatAsFieldRow } from 'components/VisualQueryEditor/FormatAsFieldRow';

export function VisualQueryEditor({ datasource, query, onChange, onRunQuery }: EditorProps) {
  const rootId = useId();
  const nsgTarget = query._nsgTarget || getDefaultTarget({ limit: 100 });
  const styles = useStyles2(getSharedStyles);

  const { variables } = useLoadVariables(datasource);
  const { tagsFacets } = useLoadTagsFacets(nsgTarget.variable, datasource);
  const columns = useMemo(() => {
    // re-generate all column ids if one of them does not have id
    if (nsgTarget.columns.find(({ id }) => !id)) {
      nsgTarget.columns.forEach((col) => (col.id = uniqueId(UNIQ_PREFIXES.columnId)));
    }
    return nsgTarget.columns;
  }, [nsgTarget.columns]);

  const fromOptions = useMemo(() => {
    const source = variables || {};
    const list = Object.keys(source).map((category, index) => {
      return {
        label: category,
        value: category.toLowerCase() + '_' + index,
        items: source[category].map((variable) => ({
          label: variable.name,
          value: variable.name,
        })),
      };
    });

    return [
      {
        label: 'Tables',
        value: 'tables',
        items: [
          { label: 'Devices', value: 'devices' },
          { label: 'Alerts', value: 'alerts' },
        ],
      },
      'divider' as 'divider',
      ...list,
    ];
  }, [variables]);

  const selectOptions = useMemo(() => {
    const source = variables || {};
    const convertedVariables = Object.keys(source).map((category, index) => {
      return {
        label: category,
        value: category.toLowerCase() + '_' + index,
        items: source[category].map((variable) => ({
          label: variable.name,
          value: variable.name,
        })),
      };
    });

    return [
      { label: 'Tags', value: 'tags', items: tagsFacets.map((tag) => ({ label: tag, value: tag })) },
      { label: 'Predefined columns', value: 'predefined_columns', items: PredefinedColumns },
      { label: 'Variables', value: 'variables', items: convertedVariables },
    ];
  }, [variables, tagsFacets]);

  const whereOptions = useMemo(() => {
    return [
      { label: 'device', value: 'device' },
      { label: 'component', value: 'component' },
      ...tagsFacets.map((tag) => ({ label: tag, value: tag })),
    ];
  }, [tagsFacets]);

  const orderByColumns = useMemo(() => {
    if (nsgTarget.format === 'table') {
      return columns
        .filter((col) => col.name !== QueryPrompts.column)
        .map(({ name, alias = '' }) => ({
          label: alias || name,
          value: alias || name,
        }));
    }

    return selectOptions.filter(({ value }) => value !== 'variables');
  }, [selectOptions, columns, nsgTarget.format]);

  const groupByColumns = useMemo(() => {
    return selectOptions.filter(({ value }) => value !== 'variables');
  }, [selectOptions]);

  function updateNsgTarget(data: Partial<ZSTarget>, runQuery = false) {
    onChange({ ...query, _nsgTarget: { ...nsgTarget, ...data } });

    if (runQuery) {
      onRunQuery();
    }
  }

  const handleFromChange = (variable: string) => {
    const norm = normalizeTarget(nsgTarget) || {};
    updateNsgTarget({ ...norm, variable }, true);
  };

  function handleToggleMode() {
    updateNsgTarget({ rawQuery: nsgTarget.rawQuery ? 0 : 1, nsgqlString: datasource.getSQLString(nsgTarget) });
  }

  const handleColumnsChange = (columns: ZSTarget['columns']) => updateNsgTarget({ columns }, true);
  const handleWhereChange = (tags: ZSTarget['tags']) => updateNsgTarget({ tags }, true);
  const handleFormatChange = (format: string) => updateNsgTarget({ format }, true);
  const handleLimitChange = (event: SelectableValue<number | null>) => updateNsgTarget({ limit: event.value! }, true);
  const handleAliasChange = (alias: string) => updateNsgTarget({ alias });
  const handleGroupByChange = (event: ZSTarget['groupBy']) => updateNsgTarget({ groupBy: event }, true);
  const handleOrderByChange = (event: ZSTarget['orderBy']) => updateNsgTarget({ orderBy: event }, true);
  const handleAdHocChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateNsgTarget({ disableAdHoc: event.target.checked }, true);

  useEffect(() => {
    let changes = normalizeTarget(nsgTarget);
    // console.log('Normalize...', changes);
    if (changes) {
      updateNsgTarget(changes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (variables === null) {
    return <LoadingPlaceholder text={'Loading....'} />;
  }

  return (
    <div id={rootId}>
      <FromFieldRow onChange={handleFromChange} value={nsgTarget.variable} options={fromOptions}>
        <QueryEditorModeSwitcher rawMode={Boolean(nsgTarget.rawQuery)} onChange={handleToggleMode} />
      </FromFieldRow>

      {nsgTarget.variable !== QueryPrompts.variable && (
        <>
          <ColumnsFieldRow value={columns} onChange={handleColumnsChange} options={selectOptions} />
          <WhereSection
            variable={nsgTarget.variable}
            datasource={datasource}
            value={nsgTarget.tags}
            onChange={handleWhereChange}
            options={whereOptions}
          />
          <OrderByFieldRow value={nsgTarget.orderBy} onChange={handleOrderByChange} options={orderByColumns} />
          <GroupByFieldRow value={nsgTarget.groupBy} onChange={handleGroupByChange} options={groupByColumns} />

          <SegmentSection label="LIMIT" fill={false}>
            <InlineField>
              <Select
                key={nsgTarget.limit}
                value={nsgTarget.limit}
                allowCustomValue={true}
                isSearchable={false}
                placeholder="Optional"
                width={13}
                options={[
                  { label: 'None', value: null },
                  { label: '1', value: 1 },
                  { label: '5', value: 5 },
                  { label: '10', value: 10 },
                  { label: '25', value: 25 },
                  { label: '50', value: 50 },
                  { label: '100', value: 100 },
                ]}
                onChange={handleLimitChange}
              ></Select>
            </InlineField>

            {nsgTarget.limit && (
              <div className="gf-form-label">
                <IconButton
                  className={noRightMargin}
                  tooltip="Clear Limit"
                  name="times"
                  size="lg"
                  variant="secondary"
                  onClick={() => handleLimitChange({ value: null })}
                />
              </div>
            )}

            <InlineField className={styles.inlineField} grow={true}>
              <InlineLabel className={noRightMargin}>
                <Tooltip content={QueryHints.limit} placement="top-start">
                  <Icon name="question-circle" />
                </Tooltip>
              </InlineLabel>
            </InlineField>
          </SegmentSection>

          <FormatAsFieldRow value={nsgTarget.format} onChange={handleFormatChange} />
          <AliasByFieldRow alias={nsgTarget.alias} onChange={handleAliasChange} onRunQuery={onRunQuery} />

          <InlineFieldRow>
            <InlineField label="DISABLE ADHOC FILTER" className={styles.inlineField}>
              <InlineSwitch value={nsgTarget.disableAdHoc} onChange={handleAdHocChange} />
            </InlineField>
            <InlineField grow={true} className={styles.inlineField}>
              <InlineLabel>
                <></>
              </InlineLabel>
            </InlineField>
            <InlineField className={styles.inlineField}>
              <InlineLabel>Plugin Version: {datasource.meta.info.version}</InlineLabel>
            </InlineField>
          </InlineFieldRow>
        </>
      )}
    </div>
  );
}
