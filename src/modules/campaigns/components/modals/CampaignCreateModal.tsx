import { createPortal } from "react-dom";

import { CampaignApiInfoSection } from "@modules/campaigns/components/sections/CampaignApiInfoSection";
import { CampaignAudienceSection } from "@modules/campaigns/components/sections/CampaignAudienceSection";
import { CampaignBasicsSection } from "@modules/campaigns/components/sections/CampaignBasicsSection";
import { CampaignCsvUploadSection } from "@modules/campaigns/components/sections/CampaignCsvUploadSection";
import { CampaignFooterActions } from "@modules/campaigns/components/sections/CampaignFooterActions";
import { CampaignMetricsBar } from "@modules/campaigns/components/sections/CampaignMetricsBar";
import { CampaignModalHeader } from "@modules/campaigns/components/sections/CampaignModalHeader";
import { CampaignPreviewSection } from "@modules/campaigns/components/sections/CampaignPreviewSection";
import { CampaignTemplateVariablesSection } from "@modules/campaigns/components/sections/CampaignTemplateVariablesSection";
import { CampaignTypeSelector } from "@modules/campaigns/components/sections/CampaignTypeSelector";
import { useCampaignForm, type CampaignCreateModalProps } from "@modules/campaigns/hooks/useCampaignForm";

export default function CampaignCreateModal(props: CampaignCreateModalProps) {
  const { isOpen, onClose, lockRecipients } = props;
  const {
    busy,
    type,
    setType,
    limitsLoading,
    tierInfo,
    audienceCount,
    estimateLoading,
    estimate,
    walletBalance,
    name,
    setName,
    scheduleType,
    changeScheduleType,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    scheduleWeekdays,
    toggleScheduleWeekday,
    scheduleTimezone,
    setScheduleTimezone,
    scheduleEndDate,
    setScheduleEndDate,
    scheduleMaxOccurrences,
    setScheduleMaxOccurrences,
    templateId,
    setTemplateId,
    approvedTemplates,
    selectedPhones,
    audienceMode,
    setAudienceMode,
    availableTags,
    savedLists,
    selectedTags,
    selectedListId,
    tagMatchedContacts,
    tagMatchMode,
    setSelectedListId,
    setTagMatchMode,
    attributeDefinitions,
    attributeFilters,
    setAttributeFilters,
    contactQuery,
    setContactQuery,
    filteredContacts,
    toggleSelectedPhone,
    toggleSelectedTag,
    summary,
    headerVars,
    setHeaderVars,
    bodyVars,
    setBodyVars,
    bodyVariableMappings,
    setBodyVariableMappings,
    otpCode,
    setOtpCode,
    buttonsNeedingValue,
    buttonValueByIndex,
    setButtonValueByIndex,
    buttonTtlMinutes,
    setButtonTtlMinutes,
    flowTokens,
    setFlowTokens,
    flowActionDataJson,
    setFlowActionDataJson,
    headerMediaUploading,
    uploadHeaderMedia,
    csvBusy,
    setCsvBusy,
    csvFileName,
    setCsvFileName,
    setCsvText,
    csvColumns,
    csvPhoneColumn,
    setCsvPhoneColumn,
    csvHeaderMap,
    setCsvHeaderMap,
    csvBodyMap,
    setCsvBodyMap,
    csvButtonMap,
    setCsvButtonMap,
    csvFirstRow,
    selectedTemplate,
    templatePreviewProps,
    demoTo,
    setDemoTo,
    demoBusy,
    setDemoBusy,
    demoSend,
    handleDemoError,
    createCampaign,
  } = useCampaignForm(props);
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-[5px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <CampaignModalHeader onClose={onClose} />

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Errors are now handled exclusively via Toasts for a cleaner UI */}

          {!type ? (
            <CampaignTypeSelector onSelect={setType} />
          ) : (
            <>
              <CampaignMetricsBar
                limitsLoading={limitsLoading}
                tierInfo={tierInfo}
                audienceCount={audienceCount}
                estimateLoading={estimateLoading}
                estimate={estimate}
                walletBalance={walletBalance}
              />

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-4">
                  <CampaignBasicsSection
                    type={type}
                    name={name}
                    scheduleType={scheduleType}
                    scheduleDate={scheduleDate}
                    scheduleTime={scheduleTime}
                    scheduleWeekdays={scheduleWeekdays}
                    scheduleTimezone={scheduleTimezone}
                    scheduleEndDate={scheduleEndDate}
                    scheduleMaxOccurrences={scheduleMaxOccurrences}
                    templateId={templateId}
                    approvedTemplates={approvedTemplates}
                    onTypeReset={() => setType(null)}
                    onNameChange={setName}
                    onScheduleTypeChange={changeScheduleType}
                    onScheduleDateChange={setScheduleDate}
                    onScheduleTimeChange={setScheduleTime}
                    onToggleScheduleWeekday={toggleScheduleWeekday}
                    onScheduleTimezoneChange={setScheduleTimezone}
                    onScheduleEndDateChange={setScheduleEndDate}
                    onScheduleMaxOccurrencesChange={setScheduleMaxOccurrences}
                    onTemplateIdChange={setTemplateId}
                  />

                  {type === "broadcast" ? (
                    <CampaignAudienceSection
                      lockRecipients={lockRecipients}
                      selectedPhones={selectedPhones}
                      audienceMode={audienceMode}
                      availableTags={availableTags}
                      savedLists={savedLists}
                      selectedTags={selectedTags}
                      selectedListId={selectedListId}
                      tagMatchMode={tagMatchMode}
                      tagMatchedCount={audienceMode !== "manual" && estimate?.totalRecipients !== undefined ? estimate.totalRecipients : tagMatchedContacts.length}
                      contactQuery={contactQuery}
                      filteredContacts={filteredContacts}
                      onAudienceModeChange={setAudienceMode}
                      onContactQueryChange={setContactQuery}
                      onTogglePhone={toggleSelectedPhone}
                      onToggleTag={toggleSelectedTag}
                      onSelectedListIdChange={setSelectedListId}
                      onTagMatchModeChange={setTagMatchMode}
                      attributeDefinitions={attributeDefinitions}
                      attributeFilters={attributeFilters}
                      onAttributeFiltersChange={setAttributeFilters}
                    />
                  ) : null}

                  {type === "broadcast" ? (
                    <CampaignTemplateVariablesSection
                      summary={summary}
                      headerVars={headerVars}
                      bodyVars={bodyVars}
                      otpCode={otpCode}
                      buttonsNeedingValue={buttonsNeedingValue}
                      buttonValueByIndex={buttonValueByIndex}
                      buttonTtlMinutes={buttonTtlMinutes}
                      flowTokens={flowTokens}
                      flowActionDataJson={flowActionDataJson}
                      headerMediaUploading={headerMediaUploading}
                      onHeaderVarsChange={setHeaderVars}
                      onBodyVarsChange={setBodyVars}
                      attributeDefinitions={attributeDefinitions}
                      bodyVariableMappings={bodyVariableMappings}
                      onBodyVariableMappingsChange={setBodyVariableMappings}
                      onOtpCodeChange={setOtpCode}
                      onButtonValueByIndexChange={setButtonValueByIndex}
                      onButtonTtlMinutesChange={setButtonTtlMinutes}
                      onFlowTokensChange={setFlowTokens}
                      onFlowActionDataJsonChange={setFlowActionDataJson}
                      onHeaderMediaUpload={uploadHeaderMedia}
                    />
                  ) : null}

                  {type === "csv" ? (
                    <CampaignCsvUploadSection
                      csvBusy={csvBusy}
                      csvFileName={csvFileName}
                      csvColumns={csvColumns}
                      csvPhoneColumn={csvPhoneColumn}
                      csvHeaderMap={csvHeaderMap}
                      csvBodyMap={csvBodyMap}
                      csvButtonMap={csvButtonMap}
                      csvFirstRow={csvFirstRow}
                      summary={summary}
                      buttonsNeedingValue={buttonsNeedingValue}
                      onCsvFileLoad={(fileName, text) => {
                        setCsvFileName(fileName);
                        setCsvText(text);
                      }}
                      onCsvBusyChange={setCsvBusy}
                      onCsvPhoneColumnChange={setCsvPhoneColumn}
                      onCsvHeaderMapChange={setCsvHeaderMap}
                      onCsvBodyMapChange={setCsvBodyMap}
                      onCsvButtonMapChange={setCsvButtonMap}
                    />
                  ) : null}
                </div>

                <CampaignPreviewSection
                  selectedTemplate={selectedTemplate}
                  templatePreviewProps={templatePreviewProps}
                  demoTo={demoTo}
                  demoBusy={demoBusy}
                  templateId={templateId}
                  type={type}
                  csvFirstRow={csvFirstRow}
                  onDemoToChange={setDemoTo}
                  onDemoSend={demoSend}
                  onDemoBusyChange={setDemoBusy}
                  onDemoError={(error) => {
                    handleDemoError(error);
                  }}
                />
              </div>

              {type === "api" ? <CampaignApiInfoSection /> : null}
            </>
          )}
        </div>

        <CampaignFooterActions
          busy={busy}
          type={type}
          name={name}
          templateId={templateId}
          estimate={estimate}
          estimateLoading={estimateLoading}
          onClose={onClose}
          onCreate={createCampaign}
        />
      </div>
    </div>,
    document.body
  );
}
