import React, { ChangeEvent } from 'react';
import { DataSourceHttpSettings, InlineField, Input, SecretInput, InlineSwitch } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { ZSDataSourceOptions, ZSSecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<ZSDataSourceOptions, ZSSecureJsonData> {}

export function ConfigEditor({ onOptionsChange, options }: Props) {
  const { jsonData, secureJsonData, secureJsonFields, readOnly } = options;

  function updateData(
    data: Partial<ZSDataSourceOptions>,
    secureData: Partial<ZSSecureJsonData> = {},
    secureJsonFieldsMap: Partial<Record<keyof ZSSecureJsonData, boolean>> = {}
  ) {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, ...data },
      secureJsonData: { ...options.secureJsonData, ...secureData },
      secureJsonFields: { ...options.secureJsonFields, ...secureJsonFieldsMap },
    });
  }

  const handleUseTokenChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateData({ useToken: event.target.checked, accessToken: '' }, { apiKey: '' }, { apiKey: false });

  const handleSafeAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateData({ accessToken: '' }, { apiKey: event.target.value });

  const handleSafeAPIKeyReset = () => updateData({}, { apiKey: '' }, { apiKey: false });

  const handleUnsafeAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateData({ accessToken: event.target.value }, { apiKey: '' }, { apiKey: false });

  const handleTokenInHeaderChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateData({ addTokenToHeader: event.target.checked });

  const HandleNetworkIdChange = (event: ChangeEvent<HTMLInputElement>) =>
    updateData({ networkId: +event.target.value });

  return (
    <div>
      <DataSourceHttpSettings
        defaultUrl=""
        showAccessOptions={true}
        dataSourceConfig={options}
        onChange={onOptionsChange}
      />
      <InlineField label="Network Id" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-network-id"
          onChange={HandleNetworkIdChange}
          value={jsonData.networkId}
          placeholder="Enter networkId"
          autoComplete="off"
          readOnly={readOnly}
          type="number"
          width={10}
        />
      </InlineField>
      <InlineField label="Auth Token" labelWidth={14} interactive>
        <InlineSwitch value={options.jsonData.useToken} onChange={handleUseTokenChange} readOnly={readOnly} />
      </InlineField>
      {options.jsonData.useToken && options.access === 'proxy' && (
        <InlineField label="API Key" labelWidth={20} interactive tooltip={'Secure (backend only store)'}>
          <SecretInput
            isConfigured={secureJsonFields.apiKey}
            value={secureJsonData?.apiKey}
            placeholder="Enter your API key"
            autoComplete="off"
            width={34}
            onReset={handleSafeAPIKeyReset}
            onChange={handleSafeAPIKeyChange}
            readOnly={readOnly}
          />
        </InlineField>
      )}

      {options.jsonData.useToken && options.access === 'direct' && (
        <>
          <InlineField
            label="API Key (Unsafe)"
            labelWidth={20}
            interactive
            tooltip={"Unsafe (the token is visible in browser's console requests)"}
          >
            <Input
              required
              autoComplete="off"
              value={jsonData.accessToken}
              placeholder="Enter your API key"
              readOnly={readOnly}
              width={34}
              onChange={handleUnsafeAPIKeyChange}
            />
          </InlineField>

          <InlineField label="Send Auth Token with HTTP header">
            <InlineSwitch
              value={options.jsonData.addTokenToHeader}
              onChange={handleTokenInHeaderChange}
              readOnly={readOnly}
            />
          </InlineField>
        </>
      )}
    </div>
  );
}
