import {
  Icon,
  IconButton,
  InlineField,
  InlineFieldRow,
  InlineLabel,
  Input,
  Stack,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { uniqueId } from 'lodash';
import React, { FormEvent, useState } from 'react';
import { CascaderSegment } from './CascaderSegment';
import { noRightMargin } from './sharedStyles';
import { QueryHints, TransformationFuncs } from 'dictionary';
import { css, cx } from '@emotion/css';
import { DropdownSegment, DropdownSegmentOption } from './DropdownSegment';
import { GrafanaTheme2 } from '@grafana/data';
import { ListOptionTree } from './types';
import { ZSTargetColumn } from 'types';
import {
  DragDropContext,
  Draggable,
  DraggableProvidedDragHandleProps,
  Droppable,
  DropResult,
  ResponderProvided,
} from '@hello-pangea/dnd';
import { UNIQ_PREFIXES } from 'services/constants';

// const getListStyle = (isDraggingOver: boolean) => ({
//   background: isDraggingOver ? 'lightblue' : 'lightgrey',
//   padding: 8,
//   width: 250,
// });

// const getItemStyle = (draggableStyle: StylePropertyMapReadOnly, isDragging: boolean) => ({
//   // some basic styles to make the items look a bit nicer
//   userSelect: 'none',
//   padding: 16,
//   margin: `0 0 ${8}px 0`,

//   // change background colour if dragging
//   background: isDragging ? 'lightgreen' : 'grey',

//   // styles we need to apply on draggables
//   ...draggableStyle,
// });

const ColumnActions = {
  CLEAR_FNS: 'clear-fns',
  ADD_ALIAS: 'add-alias',
  DEL_ALIAS: 'remove-alias',
  DEL_FUNC: 'remove-fn',
};

const CommonMenuOpts: Array<DropdownSegmentOption<string> | 'divider'> = [
  {
    label: 'Clear All Functions',
    value: ColumnActions.CLEAR_FNS,
  },
  {
    label: 'Add Alias',
    value: ColumnActions.ADD_ALIAS,
  },
  {
    label: 'Remove Alias',
    value: ColumnActions.DEL_ALIAS,
  },
  'divider',
  ...TransformationFuncs,
];

const SingleColMenuOpts: Array<DropdownSegmentOption<string> | 'divider'> = [
  {
    label: 'Remove Function',
    value: ColumnActions.DEL_FUNC,
  },
  'divider',
  ...TransformationFuncs,
];

interface Props {
  onChange: (event: ZSTargetColumn[]) => void;
  options: ListOptionTree[];
  value: ZSTargetColumn[];
}

function getLocalStyles(theme: GrafanaTheme2) {
  return {
    inlineFieldColumnsRow: css({
      width: '100%',

      '& > label:first-of-type': {
        color: theme.colors.primary.text,
      },
      '& > div': {
        flex: 'auto',
      },
      '&:last-child': {
        marginRight: 0,
      },
    }),
  };
}

function getSingleColumnStyles(theme: GrafanaTheme2) {
  return {
    spaceAround: css({
      padding: `0 ${theme.spacing(0.5)}`,
    }),

    activeText: css({
      display: 'inline-block',
      cursor: 'pointer',
      '&:hover': {
        color: theme.colors.text.maxContrast,
      },
      '&:active': {
        color: theme.colors.text.maxContrast,
      },
    }),

    dragHandler: css({
      color: theme.colors.text.disabled,
    }),
  };
}

export function ColumnsFieldRow({ value, onChange, options }: Props) {
  const localStyles = useStyles2(getLocalStyles);
  const theme = useTheme2();
  const [inline, setInline] = useState(true);

  function handleChangeColumn(column: ZSTargetColumn, index: number): void {
    const nextValue = [...value];
    nextValue.splice(index, 1, column);
    onChange(nextValue);
  }

  function handleAddColumn(event: string): void {
    onChange([...value, { name: event, id: uniqueId(UNIQ_PREFIXES.columnId) }]);
  }

  function handleRemoveColumn(col: ZSTargetColumn) {
    const nextValue = [...value];
    nextValue.splice(value.indexOf(col), 1);
    onChange(nextValue);
  }

  function handleDragEnd(result: DropResult<string>, provided: ResponderProvided) {
    if (!result.destination) {
      return;
    }

    const nextValue = [...value];
    const [removed] = nextValue.splice(result.source.index, 1);
    nextValue.splice(result.destination.index, 0, removed);

    onChange(nextValue);
  }

  const segments = value
    // .filter(({ visible }) => visible !== false)
    .map((col, i) => (
      <Draggable key={col.id} draggableId={col.id} index={i}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.draggableProps}>
            <ColumnSegment
              column={col}
              onRemove={handleRemoveColumn}
              onChange={(col) => handleChangeColumn(col, i)}
              options={options}
              dragHandlerProps={provided.dragHandleProps}
            />
          </div>
        )}
      </Draggable>
    ));

  return (
    <InlineFieldRow>
      <InlineField label="SELECT" labelWidth={12} className={localStyles.inlineFieldColumnsRow} grow={true}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="droppable" direction={inline ? 'horizontal' : 'vertical'}>
            {(provided, snapshot) => (
              <Stack
                gap={0.5}
                wrap={'wrap'}
                grow={1}
                direction={inline ? 'row' : 'column'}
                alignItems={'flex-start'}
                ref={provided.innerRef}
              >
                {segments} {provided.placeholder}
                <Stack direction={'row'} grow={1} gap={0}>
                  <InlineLabel as={'div'} width={'auto'} style={{ gap: theme.spacing(1) }}>
                    <CascaderSegment options={options} onSelect={handleAddColumn} selected={''}>
                      <IconButton tooltip="Add Criteria" name="plus" size="lg" variant="secondary" />
                    </CascaderSegment>
                    <ModeSwitcher inline={inline} onChange={setInline} />
                  </InlineLabel>
                  <InlineLabel as={'div'} className={noRightMargin} style={{ flexGrow: 1 }} width={'auto'}>
                    <Tooltip content={QueryHints.select} placement="top-end">
                      <Icon name="question-circle" />
                    </Tooltip>
                  </InlineLabel>
                </Stack>
              </Stack>
            )}
          </Droppable>
        </DragDropContext>
      </InlineField>
    </InlineFieldRow>
  );
}

interface ColumnSegmentProps extends Pick<Props, 'options'> {
  column: ZSTargetColumn;
  onRemove: (col: ZSTargetColumn) => void;
  onChange: (col: ZSTargetColumn) => void;
  dragHandlerProps?: DraggableProvidedDragHandleProps | null;
}

function ColumnSegment({ column, onRemove, onChange, options, dragHandlerProps }: ColumnSegmentProps) {
  const theme = useTheme2();
  const styles = useStyles2(getSingleColumnStyles);

  function handleMenuItemSelect(event: DropdownSegmentOption<string>) {
    const nextValue = { ...column };

    switch (event.value) {
      case ColumnActions.ADD_ALIAS:
        nextValue.alias = uniqueId(UNIQ_PREFIXES.columnName);
        break;
      case ColumnActions.DEL_ALIAS:
        delete nextValue.alias;
        break;
      case ColumnActions.CLEAR_FNS:
        nextValue.appliedFunctions = [];
        break;
      default:
        nextValue.appliedFunctions = nextValue.appliedFunctions || [];
        nextValue.appliedFunctions?.push({ name: event.value! });
    }

    onChange(nextValue);
  }

  function handleColumnFuncChange(event: string, index: number): void {
    const nextCol = {
      ...column,
      appliedFunctions: [...column.appliedFunctions!],
    };

    switch (event) {
      case ColumnActions.DEL_FUNC:
        nextCol.appliedFunctions.splice(index, 1);
        break;
      default:
        nextCol.appliedFunctions[index] = { name: event };
    }

    onChange(nextCol);
  }

  function handleColumnNameChange(event: string) {
    onChange({ ...column, name: event });
  }

  const appliedFunctions = column.appliedFunctions || [];
  const openFNs = appliedFunctions.map(({ name }, i) => (
    <DropdownSegment
      key={`${i}_${name}`}
      selected="name"
      options={SingleColMenuOpts}
      onSelect={(event) => handleColumnFuncChange(event.value!, i)}
    >
      <span className={cx(styles.activeText, styles.spaceAround)}>{name} (</span>
    </DropdownSegment>
  ));
  const closeFNs = (
    <>
      {appliedFunctions.length > 0 && (
        <div className={styles.spaceAround}>{appliedFunctions.map(() => ')').join(' ')}</div>
      )}
    </>
  );

  function handleAliasChange(event: FormEvent<HTMLInputElement>): void {
    onChange({ ...column, alias: (event.target as HTMLInputElement).value });
  }

  return (
    <InlineLabel as={'div'} className={cx(noRightMargin)} style={{ paddingLeft: theme.spacing(1) }} width={'auto'}>
      <DropdownSegment
        selected=""
        options={CommonMenuOpts.filter(
          (opt) =>
            typeof opt === 'string' ||
            opt.value !== (!!column.alias ? ColumnActions.ADD_ALIAS : ColumnActions.DEL_ALIAS)
        )}
        onSelect={handleMenuItemSelect}
      >
        <IconButton
          style={{ marginRight: theme.spacing(1) }}
          name={'ellipsis-h'}
          size="lg"
          variant="secondary"
          tooltip="Column Functions"
        ></IconButton>
      </DropdownSegment>

      <div style={{ display: 'inline-flex', marginRight: theme.spacing(1) }}>
        {openFNs}

        <CascaderSegment selected="" options={options} onSelect={handleColumnNameChange}>
          <span className={styles.activeText}>{column.name}</span>
        </CascaderSegment>

        {closeFNs}

        {column.alias && (
          <>
            <span className={styles.spaceAround} style={{ color: theme.colors.primary.text }}>
              AS
            </span>
            <Input width={12} value={column.alias!} onChangeCapture={handleAliasChange} />
          </>
        )}
      </div>

      <IconButton
        name="trash-alt"
        onClick={() => onRemove(column)}
        size="lg"
        variant="secondary"
        tooltip={'Remove column'}
      />
      <div {...dragHandlerProps} className={cx(styles.activeText, styles.dragHandler)}>
        <Icon name="draggabledots" className={noRightMargin} size="lg" />
      </div>
    </InlineLabel>
  );
}

function ModeSwitcher({ inline, onChange }: { inline: boolean; onChange: (value: boolean) => void }) {
  return (
    <IconButton
      onClick={() => onChange(!inline)}
      className={noRightMargin}
      tooltip={inline ? 'Switch to align columns one per line' : 'Switch to align columns by default'}
      name={'columns'}
      size="lg"
      variant="secondary"
      style={{ transform: inline ? 'rotate(90deg)' : 'none' }}
    />
  );
}
