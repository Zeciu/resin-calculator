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

    modifyProject: t("calculator.modifyProject"),

    modifyProjectActive: t("calculator.modifyProjectActive"),

    referencesComplete: t("calculator.referencesComplete"),

    editSelectedReference: t("calculator.editSelectedReference"),

    deleteSelectedReference: t("calculator.deleteSelectedReference"),

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

    deleteSelectedCavity: t("calculator.deleteSelectedCavity"),

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

    projectNotesPlaceholder: t("calculator.projectNotesPlaceholder"),

    advancedDetails: t("calculator.advancedDetails"),

    viewNavigation: t("calculator.viewNavigation"),

    fitToScreen: t("calculator.fitToScreen"),

    zoomIn: t("calculator.zoomIn"),

    zoomOut: t("calculator.zoomOut"),

    resetZoom: t("calculator.resetZoom"),

    rotateLeft: t("calculator.rotateLeft"),

    rotateRight: t("calculator.rotateRight"),

    status: {
      wood: t("calculator.status.wood"),
      standard: t("calculator.status.standard"),
      refs: (count) => t("calculator.status.refs", { count }),
      modify: t("calculator.status.modify"),
      zoom: (percent) => t("calculator.status.zoom", { percent }),
      rotation: (degrees) => t("calculator.status.rotation", { degrees }),
      edit: t("calculator.status.edit"),
    },

    woodIslandItem: (index) => t("calculator.woodIslandItem", { index }),

    deleteWoodIslandItem: (index) => t("calculator.deleteWoodIslandItem", { index }),

    cavityDepthsAndVolumes: t("calculator.cavityDepthsAndVolumes"),

    cavityNeedsReferences: t("calculator.cavityNeedsReferences"),

    details: t("calculator.details"),

    needsCalibration: t("calculator.needsCalibration"),

    enterDepth: t("calculator.enterDepth"),

    confirmDepth: t("calculator.confirmDepth"),

    editDepth: t("calculator.editDepth"),

    deleteNamed: (name) => t("calculator.deleteNamed", { name }),

    uploadPhotoGuidance: t("calculator.uploadPhotoGuidance"),

    referenceGuidance: t("calculator.referenceGuidance"),

    moldGuidance: t("calculator.moldGuidance"),

    woodGuidance: t("calculator.woodGuidance"),

    cavityGuidance: t("calculator.cavityGuidance"),

    clickSelectTwoPoints: t("calculator.clickSelectTwoPoints"),

    exampleLengthPlaceholder: t("calculator.exampleLengthPlaceholder"),

    areaStatus: (status) => t("calculator.areaStatus", { status }),

    volumeStatus: (status) => t("calculator.volumeStatus", { status }),

    resultsOutdated: t("calculator.resultsOutdated"),

    resinDensity: t("calculator.resinDensity"),

    resinDensityUnit: t("calculator.resinDensityUnit"),

    resinDensityHelp: t("calculator.resinDensityHelp"),

    cost: {
      sectionTitle: t("calculator.cost.sectionTitle"),
      calculatedResinVolume: t("calculator.cost.calculatedResinVolume"),
      resinQuantityForCosting: t("calculator.cost.resinQuantityForCosting"),
      resinCostPerLiter: (unit) => t("calculator.cost.resinCostPerLiter", { unit }),
      resinTotal: t("calculator.cost.resinTotal"),
      woodCost: t("calculator.cost.woodCost"),
      otherProjectCosts: t("calculator.cost.otherProjectCosts"),
      laborHours: t("calculator.cost.laborHours"),
      laborHourlyRate: t("calculator.cost.laborHourlyRate"),
      laborTotal: t("calculator.cost.laborTotal"),
      estimatedProjectCost: t("calculator.cost.estimatedProjectCost"),
      desiredMarkup: t("calculator.cost.desiredMarkup"),
      suggestedSellingPrice: t("calculator.cost.suggestedSellingPrice"),
      volumeUnit: t("calculator.cost.volumeUnit"),
      percentUnit: t("calculator.cost.percentUnit"),
    },

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

      mainDepth: (value, unit) => t("calculator.result.mainDepth", { value, unit }),

      mainVolume: (value) => t("calculator.result.mainVolume", { value }),

      cavitiesSection: t("calculator.result.cavitiesSection"),

      cavityItem: (index) => t("calculator.result.cavityItem", { index }),

      depth: (value, unit) => t("calculator.result.depth", { value, unit }),

      volume: (value) => t("calculator.result.volume", { value }),

      totalsSection: t("calculator.result.totalsSection"),

      totalResinVolume: (value) => t("calculator.result.totalResinVolume", { value }),

      estimatedWeight: t("calculator.result.estimatedWeight"),

      estimatedWeightValue: (value) => t("calculator.result.estimatedWeightValue", { value }),

      estimatedMixedResinWeight: t("calculator.result.estimatedMixedResinWeight"),

      estimatedRecommendedWeight: t("calculator.result.estimatedRecommendedWeight"),

    },

    planning: {

      optionalToolsTitle: t("calculator.planning.optionalToolsTitle"),

      optionalToolsSubtitle: t("calculator.planning.optionalToolsSubtitle"),

      firstFillTitle: t("calculator.planning.firstFillTitle"),

      firstFillThicknessLabel: (unit) => t("calculator.planning.firstFillThicknessLabel", { unit }),

      firstFillThicknessPlaceholder: (value, unit) =>
        t("calculator.planning.firstFillThicknessPlaceholder", { value, unit }),

      calculateFirstFillVolume: t("calculator.planning.calculateFirstFillVolume"),

      firstFillVolume: t("calculator.planning.firstFillVolume"),

      firstFillRecommendationMode: t("calculator.planning.firstFillRecommendationMode"),

      firstFillSealedUnderneath: t("calculator.planning.firstFillSealedUnderneath"),

      firstFillUnsealedUnderneath: t("calculator.planning.firstFillUnsealedUnderneath"),

      firstFillTableHelper: t("calculator.planning.firstFillTableHelper"),

      pourLayerTitle: t("calculator.planning.pourLayerTitle"),

      maxPourThicknessLabel: (unit) => t("calculator.planning.maxPourThicknessLabel", { unit }),

      resinMixRatioLabel: t("calculator.planning.resinMixRatioLabel"),

      calculatePourPlan: t("calculator.planning.calculatePourPlan"),

      tablePour: t("calculator.planning.tablePour"),

      tableThickness: t("calculator.planning.tableThickness"),

      tableResinVolume: t("calculator.planning.tableResinVolume"),

      tableRecommendedAmount: t("calculator.planning.tableRecommendedAmount"),

      tableComponentA: t("calculator.planning.tableComponentA"),

      tableComponentB: t("calculator.planning.tableComponentB"),

      layerBalanceNote: t("calculator.planning.layerBalanceNote"),

      mixRatioVolumeNote: t("calculator.planning.mixRatioVolumeNote"),

    },

    pdf: {

      reportGenerated: (datetime) => t("calculator.pdf.reportGenerated", { datetime }),

      projectImage: t("calculator.pdf.projectImage"),

      calculationMode: t("calculator.pdf.calculationMode"),

      mode: t("calculator.pdf.mode"),

      woodBoundaryMode: t("calculator.pdf.woodBoundaryMode"),

      standardResinArea: t("calculator.pdf.standardResinArea"),

      results: t("calculator.pdf.results"),

      resinArea: t("calculator.pdf.resinArea"),

      depth: t("calculator.pdf.depth"),

      volume: t("calculator.pdf.volume"),

      moldArea: t("calculator.pdf.moldArea"),

      totalWoodIslandArea: t("calculator.pdf.totalWoodIslandArea"),

      woodIslands: t("calculator.pdf.woodIslands"),

      mainResinArea: t("calculator.pdf.mainResinArea"),

      mainResinVolume: t("calculator.pdf.mainResinVolume"),

      recommendedAmountTenPercent: t("calculator.pdf.recommendedAmountTenPercent"),

      totalResinVolume: t("calculator.pdf.totalResinVolume"),

      firstFillSection: t("calculator.pdf.firstFillSection"),

      firstFillThickness: t("calculator.pdf.firstFillThickness"),

      firstFillVolume: t("calculator.pdf.firstFillVolume"),

      selectedFirstFillRecommendation: t("calculator.pdf.selectedFirstFillRecommendation"),

      selectedFirstFillAmount: t("calculator.pdf.selectedFirstFillAmount"),

      pourPlanningSection: t("calculator.pdf.pourPlanningSection"),

      maxPourThickness: t("calculator.pdf.maxPourThickness"),

      resinMixRatio: t("calculator.pdf.resinMixRatio"),

      pourN: (index) => t("calculator.pdf.pourN", { index }),

      pourFirstFill: (index) => t("calculator.pdf.pourFirstFill", { index }),

      recommended: t("calculator.pdf.recommended"),

      componentA: t("calculator.pdf.componentA"),

      componentB: t("calculator.pdf.componentB"),

      notAvailable: t("calculator.pdf.notAvailable"),

      area: t("calculator.pdf.area"),

      totals: t("calculator.pdf.totals"),

      noReferences: t("calculator.pdf.noReferences"),

      noCavities: t("calculator.pdf.noCavities"),

      noProjectNotes: t("calculator.pdf.noProjectNotes"),

      scaleInformation: t("calculator.pdf.scaleInformation"),

      horizontalScaleAverage: t("calculator.pdf.horizontalScaleAverage"),

      verticalScaleAverage: t("calculator.pdf.verticalScaleAverage"),

      referencesUsed: t("calculator.pdf.referencesUsed"),

      axisReferencesTracked: (axisCount, diagonalCount) =>

        t("calculator.pdf.axisReferencesTracked", { axisCount, diagonalCount }),

      directionHorizontal: t("calculator.pdf.direction.horizontal"),

      directionVertical: t("calculator.pdf.direction.vertical"),

      directionDiagonal: t("calculator.pdf.direction.diagonal"),

      directionUnknown: t("calculator.pdf.direction.unknown"),

      resinDensityUsed: t("calculator.pdf.resinDensityUsed"),

      estimatedMixedResinWeight: t("calculator.pdf.estimatedMixedResinWeight"),

      estimatedRecommendedWeight: t("calculator.pdf.estimatedRecommendedWeight"),

      estimatedWeight: t("calculator.pdf.estimatedWeight"),

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

        examples: (value, unit) => t("calculator.help.mainResinDepth.examples", { value, unit }),

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

      resinDensity: {

        title: t("calculator.help.resinDensity.title"),

        text: t("calculator.help.resinDensity.text"),

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

      pdfImageUnavailable: t("calculator.error.pdfImageUnavailable"),

      layerPlanningUnavailable: t("calculator.error.layerPlanningUnavailable"),

      firstFillPlanningUnavailable: t("calculator.error.firstFillPlanningUnavailable"),

      upgradeHint: t("calculator.error.upgradeHint"),

      mainDepthBeforeLayers: t("calculator.error.mainDepthBeforeLayers"),

      maxPourThicknessPositive: t("calculator.error.maxPourThicknessPositive"),

      calculateVolumeBeforePlanning: t("calculator.error.calculateVolumeBeforePlanning"),

      firstFillThicknessRange: t("calculator.error.firstFillThicknessRange"),

      firstFillThicknessPositive: t("calculator.error.firstFillThicknessPositive"),

      resinDensityRange: t("calculator.error.resinDensityRange"),

      polygonPointLimit: (maxPoints, polygonKind) =>

        t("calculator.error.polygonPointLimit", {

          maxPoints,

          kind: t(`calculator.polygonKind.${polygonKind}`),

        }),

    },

  };

}


