import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { newCtaButton } from "@modules/templates/utils/helpers";
import { TemplatePreview } from "@modules/templates/components/TemplatePreview";
import { AuthenticationTemplateSection } from "@modules/templates/components/sections/AuthenticationTemplateSection";
import { TemplateBodySection } from "@modules/templates/components/sections/TemplateBodySection";
import { TemplateBasicsSection } from "@modules/templates/components/sections/TemplateBasicsSection";
import { TemplateFormHeader } from "@modules/templates/components/sections/TemplateFormHeader";
import { TemplateHeaderSection } from "@modules/templates/components/sections/TemplateHeaderSection";
import { TemplateCtaSection } from "@modules/templates/components/sections/TemplateCtaSection";
import { useTemplateFormState } from "@modules/templates/forms/useTemplateFormState";
import type { TemplateCategory } from "@modules/templates/types/templates.types";

type Props = {
  open: boolean;
  creating: boolean;
  languageOptions: string[];
  mode?: "create" | "edit";
  initialTemplate?: { name: string; language: string; category: TemplateCategory; components: any[] } | null;
  onClose: () => void;
  onCreate: (payload: { name: string; language: string; category: TemplateCategory; components: any[] }) => Promise<void>;
};

export function TemplateForm({ open, creating, languageOptions, mode = "create", initialTemplate = null, onClose, onCreate }: Props) {
  const vm = useTemplateFormState({ open, mode, initialTemplate });
  const { state, refs, derived, setters, actions } = vm;
  if (!open) return null;

  return (
    <Card className="p-6 md:p-10 bg-white shadow-2xl border-none">
      <TemplateFormHeader mode={mode} onClose={onClose} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form className="grid gap-5" onSubmit={(e) => actions.submitTemplate(e, onCreate, onClose)}>
          <TemplateBasicsSection category={state.category} language={state.language} languageOptions={languageOptions} mode={mode} name={state.name} onCategoryChange={setters.setCategory} onLanguageChange={setters.setLanguage} onNameChange={setters.setName} />

          {state.category === "authentication" ? (
            <AuthenticationTemplateSection authAddExpiration={state.authAddExpiration} authAddSecurity={state.authAddSecurity} authAppsValid={derived.authAppsValid} authExpiresMinutes={state.authExpiresMinutes} authOtpType={state.authOtpType} authRequiresAppSetup={derived.authRequiresAppSetup} authSupportedApps={state.authSupportedApps} setAuthAddExpiration={setters.setAuthAddExpiration} setAuthAddSecurity={setters.setAuthAddSecurity} setAuthExpiresMinutes={setters.setAuthExpiresMinutes} setAuthOtpType={setters.setAuthOtpType} setAuthSupportedApps={setters.setAuthSupportedApps} />
          ) : (
            <TemplateHeaderSection clearHeaderMedia={actions.clearHeaderMedia} headerText={state.headerText} headerTextRef={refs.headerTextRef} headerType={state.headerType} headerVariableIndexes={derived.headerVariableIndexes} headerVariablesSequential={derived.headerVariablesSequential} headerVariableValues={state.headerVariableValues} locationAddress={state.locationAddress} locationLatitude={state.locationLatitude} locationLongitude={state.locationLongitude} locationName={state.locationName} mediaHandle={state.mediaHandle} mediaInputRef={refs.mediaInputRef} mediaUploadError={state.mediaUploadError} mediaUploadPct={state.mediaUploadPct} mediaUploading={state.mediaUploading} nextHeaderVariableIndex={derived.nextHeaderVariableIndex} setHeaderText={setters.setHeaderText} setHeaderType={setters.setHeaderType} setHeaderVariableValues={setters.setHeaderVariableValues} setLocationAddress={setters.setLocationAddress} setLocationLatitude={setters.setLocationLatitude} setLocationLongitude={setters.setLocationLongitude} setLocationName={setters.setLocationName} uploadHeaderMedia={actions.uploadHeaderMedia} />
          )}

          {state.category !== "authentication" ? (
            <TemplateBodySection bodyRef={refs.bodyRef} bodyText={state.bodyText} bodyVariablesSequential={derived.bodyVariablesSequential} insertAtSelection={actions.insertAtSelection} nextVariableIndex={derived.nextVariableIndex} runNativeUndoRedo={actions.runNativeUndoRedo} setBodyText={setters.setBodyText} setVariableValues={setters.setVariableValues} variableIndexes={derived.variableIndexes} variableValues={state.variableValues} wrapSelection={actions.wrapSelection} />
          ) : null}

          {state.category !== "authentication" ? <Input label="Footer (Optional)" value={state.footerText} onChange={(e) => setters.setFooterText(e.target.value)} placeholder="Add a short line to the bottom of your message." className="rounded-[5px] shadow-none" /> : null}

          {state.category !== "authentication" ? (
            <TemplateCtaSection ctaButtons={state.ctaButtons} ctaLimit={derived.ctaLimit} canAddCta={derived.canAddCta} ctaError={state.ctaError} setCtaError={setters.setCtaError} ctaOptions={derived.ctaOptions} buttonTypeCounts={derived.buttonTypeCounts} buttonTypeLimit={derived.buttonTypeLimit} wouldExceedLimit={actions.wouldExceedLimit} setCtaButtons={setters.setCtaButtons} newCtaButton={newCtaButton} flows={state.flows} flowsLoading={state.flowsLoading} flowsError={state.flowsError} refreshFlows={actions.refreshFlows} voiceCallDayOptions={derived.voiceCallDayOptions} />
          ) : null}

          <div className="mt-2 flex justify-end">
            <Button type="submit" className="rounded-[5px] px-8 py-2.5 shadow-none w-full sm:w-auto" disabled={!derived.canCreate || creating}>
              {creating ? "Submitting..." : "Submit Template"}
            </Button>
          </div>
        </form>

        <div className="sticky top-6 self-start">
          <TemplatePreview
            category={state.category}
            headerType={state.headerType}
            headerText={state.headerText}
            mediaHandle={state.mediaHandle}
            mediaPreviewUrl={state.mediaPreviewUrl}
            mediaMeta={state.mediaMeta}
            headerLocation={state.headerType === "LOCATION" ? { name: state.locationName, address: state.locationAddress, latitude: Number(state.locationLatitude), longitude: Number(state.locationLongitude) } : null}
            headerVariableValues={state.headerVariableValues}
            bodyText={state.bodyText}
            footerText={state.footerText}
            ctaButtons={state.ctaButtons}
            variableValues={state.variableValues}
            authConfig={state.category === "authentication" ? { otpType: state.authOtpType, addSecurityRecommendation: state.authAddSecurity, includeExpirationWarning: state.authAddExpiration, expiresInMinutes: state.authAddExpiration ? Number(state.authExpiresMinutes) || 10 : undefined } : null}
          />
        </div>
      </div>
    </Card>
  );
}
