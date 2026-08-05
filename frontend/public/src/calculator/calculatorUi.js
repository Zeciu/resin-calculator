/**

 * Primary calculator UI strings for the wood-boundary workflow.

 * @param {(key: string, params?: Record<string, unknown>) => string} t

 */

export function buildCalculatorUi(t) {

  return {

    title: t("calculator.title"),

    uploadPhoto: t("calculator.uploadPhoto"),

    chooseFile: t("calculator.chooseFile"),

    photoUploaded: t("calculator.photoUploaded"),

    uploadHelper: t("calculator.uploadHelper"),

    step1Title: t("calculator.step1Title"),

    step1Body: t("calculator.step1Body"),

    workflowProgress: t("calculator.workflowProgress"),

    workflow: {

      references: t("calculator.workflow.references"),

      mold: t("calculator.workflow.mold"),

      wood: t("calculator.workflow.wood"),

      cavities: t("calculator.workflow.cavities"),

      calculate: t("calculator.workflow.calculate"),

      area: t("calculator.workflow.area"),

    },

    referenceMeasurements: t("calculator.referenceMeasurements"),

    referenceItem: (index) => t("calculator.referenceItem", { index }),

    delete: t("calculator.delete"),

    addReferenceMeasurement: t("calculator.addReferenceMeasurement"),

    doneWithMeasurements: t("calculator.doneWithMeasurements"),

    step2Title: t("calculator.step2Title"),

    step2Body: t("calculator.step2Body"),

    referenceDraft: (unit) => t("calculator.referenceDraft", { unit }),

    saveReferenceMeasurement: t("calculator.saveReferenceMeasurement"),

    moldBoundary: t("calculator.moldBoundary"),

    drawMoldBoundary: t("calculator.drawMoldBoundary"),

    clearMoldBoundary: t("calculator.clearMoldBoundary"),

    finishMold: t("calculator.finishMold"),

    moldComplete: t("calculator.moldComplete"),

    editMoldBoundary: t("calculator.editMoldBoundary"),

    step3Title: t("calculator.step3Title"),

    step3Body: t("calculator.step3Body"),

    woodIslands: t("calculator.woodIslands"),

    addWoodIsland: t("calculator.addWoodIsland"),

    completeCurrentIsland: t("calculator.completeCurrentIsland"),

    deleteSelectedWoodIsland: t("calculator.deleteSelectedWoodIsland"),

    doneWithWood: t("calculator.doneWithWood"),

    woodComplete: t("calculator.woodComplete"),

    editSelectedWoodIsland: t("calculator.editSelectedWoodIsland"),

    clearWoodIslands: t("calculator.clearWoodIslands"),

    undoLastPoint: t("calculator.undoLastPoint"),

    step4Title: t("calculator.step4Title"),

    step4Body: t("calculator.step4Body"),

    resinCavities: t("calculator.resinCavities"),

    addResinCavity: t("calculator.addResinCavity"),

    finishCavity: t("calculator.finishCavity"),

    editSelectedCavity: t("calculator.editSelectedCavity"),

    clearAllCavities: t("calculator.clearAllCavities"),

    finishCavities: t("calculator.finishCavities"),

    cavitiesComplete: t("calculator.cavitiesComplete"),

    step5Title: t("calculator.step5Title"),

    step5Body: t("calculator.step5Body"),

    calculate: t("calculator.workflow.calculate"),

    calculateResinVolume: t("calculator.calculateResinVolume"),

    projectActions: t("calculator.projectActions"),

    saveProject: t("calculator.saveProject"),

    exportPdf: t("calculator.exportPdf"),

    projectNotes: t("calculator.projectNotes"),

    resultsOutdated: t("calculator.resultsOutdated"),

    result: {

      totalResinRequired: t("calculator.result.totalResinRequired"),

      recommendedAmountTenPercent: t("calculator.result.recommendedAmountTenPercent"),

      recommendedAmountWithMargin: (percent) =>

        t("calculator.result.recommendedAmountWithMargin", { percent }),

      selectedArea: (value) => t("calculator.result.selectedArea", { value }),

      estimatedVolume: (value, unit) =>

        t("calculator.estimatedVolume", { value, unit }),

      detailedBreakdown: t("calculator.result.detailedBreakdown"),

      summaryAreas: t("calculator.result.summaryAreas"),

      moldArea: (value) => t("calculator.result.moldArea", { value }),

      moldSource: t("calculator.result.moldSource"),

      moldSourceImageBorder: t("calculator.result.moldSourceImageBorder"),

      moldSourceDrawnBoundary: t("calculator.result.moldSourceDrawnBoundary"),

      totalWoodIslandArea: (value) => t("calculator.result.totalWoodIslandArea", { value }),

      woodIslandsCount: (count) => t("calculator.result.woodIslandsCount", { count }),

      mainResinArea: (value) => t("calculator.result.mainResinArea", { value }),

      isolatedCavityArea: (value) => t("calculator.result.isolatedCavityArea", { value }),

      mainResinSection: t("calculator.result.mainResinSection"),

      area: (value) => t("calculator.result.area", { value }),

      mainDepth: (value) => t("calculator.result.mainDepth", { value }),

      mainVolume: (value) => t("calculator.result.mainVolume", { value }),

      cavitiesSection: t("calculator.result.cavitiesSection"),

      cavityItem: (index) => t("calculator.result.cavityItem", { index }),

      depth: (value) => t("calculator.result.depth", { value }),

      volume: (value) => t("calculator.result.volume", { value }),

      totalsSection: t("calculator.result.totalsSection"),

      totalResinVolume: (value) => t("calculator.result.totalResinVolume", { value }),

    },

    planning: {

      optionalToolsTitle: t("calculator.planning.optionalToolsTitle"),

      optionalToolsSubtitle: t("calculator.planning.optionalToolsSubtitle"),

      firstFillTitle: t("calculator.planning.firstFillTitle"),

      firstFillThicknessLabel: t("calculator.planning.firstFillThicknessLabel"),

      firstFillThicknessPlaceholder: t("calculator.planning.firstFillThicknessPlaceholder"),

      calculateFirstFillVolume: t("calculator.planning.calculateFirstFillVolume"),

      firstFillVolume: t("calculator.planning.firstFillVolume"),

      firstFillRecommendationMode: t("calculator.planning.firstFillRecommendationMode"),

      firstFillSealedUnderneath: t("calculator.planning.firstFillSealedUnderneath"),

      firstFillUnsealedUnderneath: t("calculator.planning.firstFillUnsealedUnderneath"),

      firstFillTableHelper: t("calculator.planning.firstFillTableHelper"),

      pourLayerTitle: t("calculator.planning.pourLayerTitle"),

      maxPourThicknessLabel: t("calculator.planning.maxPourThicknessLabel"),

      resinMixRatioLabel: t("calculator.planning.resinMixRatioLabel"),

      calculatePourPlan: t("calculator.planning.calculatePourPlan"),

      tablePour: t("calculator.planning.tablePour"),

      tableThickness: t("calculator.planning.tableThickness"),

      tableResinVolume: t("calculator.planning.tableResinVolume"),

      tableRecommendedAmount: t("calculator.planning.tableRecommendedAmount"),

      tableComponentA: t("calculator.planning.tableComponentA"),

      tableComponentB: t("calculator.planning.tableComponentB"),

      layerBalanceNote: t("calculator.planning.layerBalanceNote"),

    },

    helpAbout: (title) => t("calculator.help.about", { title }),

    help: {

      photo: {

        title: t("calculator.help.photo.title"),

        text: t("calculator.help.photo.text"),

      },

      reference: {

        title: t("calculator.help.reference.title"),

        text: t("calculator.help.reference.text"),

      },

      mold: {

        title: t("calculator.help.mold.title"),

        text: t("calculator.help.mold.text"),

      },

      wood: {

        title: t("calculator.help.wood.title"),

        text: t("calculator.help.wood.text"),

      },

      cavity: {

        title: t("calculator.help.cavity.title"),

        text: t("calculator.help.cavity.text"),

      },

      mainResinDepth: {

        title: t("calculator.help.mainResinDepth.title"),

        text: t("calculator.help.mainResinDepth.text"),

        examples: t("calculator.help.mainResinDepth.examples"),

      },

      firstFill: {

        title: t("calculator.help.firstFill.title"),

        text: t("calculator.help.firstFill.text"),

      },

      pourLayer: {

        title: t("calculator.help.pourLayer.title"),

        text1: t("calculator.help.pourLayer.text1"),

        text2: t("calculator.help.pourLayer.text2"),

      },

    },

    errors: {

      readUploadedImage: t("calculator.error.readUploadedImage"),

      uploadImageFirst: t("calculator.error.uploadImageFirst"),

      uploadImageBeforeSave: t("calculator.error.uploadImageBeforeSave"),

      addReferenceBeforeContinue: t("calculator.error.addReferenceBeforeContinue"),

      drawMoldBeforeContinue: t("calculator.error.drawMoldBeforeContinue"),

      completeWoodIslandFirst: t("calculator.error.completeWoodIslandFirst"),

      addWoodIslandBeforeContinue: t("calculator.error.addWoodIslandBeforeContinue"),

      woodIslandMinPoints: t("calculator.error.woodIslandMinPoints"),

      cavityMinPoints: t("calculator.error.cavityMinPoints"),

      calculateBeforePdf: t("calculator.error.calculateBeforePdf"),

      pdfExportUnavailable: t("calculator.error.pdfExportUnavailable"),

      layerPlanningUnavailable: t("calculator.error.layerPlanningUnavailable"),

      firstFillPlanningUnavailable: t("calculator.error.firstFillPlanningUnavailable"),

      upgradeHint: t("calculator.error.upgradeHint"),

      mainDepthBeforeLayers: t("calculator.error.mainDepthBeforeLayers"),

      maxPourThicknessPositive: t("calculator.error.maxPourThicknessPositive"),

      calculateVolumeBeforePlanning: t("calculator.error.calculateVolumeBeforePlanning"),

      firstFillThicknessRange: t("calculator.error.firstFillThicknessRange"),

      firstFillThicknessPositive: t("calculator.error.firstFillThicknessPositive"),

      polygonPointLimit: (maxPoints, polygonKind) =>

        t("calculator.error.polygonPointLimit", {

          maxPoints,

          kind: t(`calculator.polygonKind.${polygonKind}`),

        }),

    },

  };

}


