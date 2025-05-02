import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export function getSharedStyles(theme: GrafanaTheme2) {
  return {
    inlineField: css({
      '& > label:first-of-type': {
        color: theme.colors.primary.text,
      },
      '&:last-child': {
        marginRight: 0,
      },
    }),
    inlineField2: css({
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
    inlineLabel: css({
      cursor: 'pointer',
      '&:active': {
        color: theme.colors.primary.contrastText,
      },
    }),
  };
}

export const noRightMargin = css({ marginRight: 0 });
