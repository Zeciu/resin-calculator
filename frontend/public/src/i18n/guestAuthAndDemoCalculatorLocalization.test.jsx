import { createRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { TestProviders } from "../test/TestProviders.jsx";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { ROUTES } from "../workspace/routes.js";
import {
  collectLiteralKeysFromFiles,
  loadActivePublicLocales,
} from "./publicLocalizationTestUtils.js";
import {
  DEMO_CALCULATOR_DYNAMIC_UI_KEYS,
  GUEST_AUTH_UI_KEYS,
  localeBundleHasOwnKey,
  translate,
} from "./translate.js";

const GUEST_AUTH_SOURCE_FILES = ["auth/LoginPage.jsx", "auth/PasswordRecoveryPage.jsx"];

const DEMO_CALCULATOR_SOURCE_FILES = [
  "calculator/calculatorUi.js",
  "calculator/useCalculatorDisplayUnits.js",
  "calculator/ProjectCostEstimate.jsx",
  "preferences/QuickPreferences.jsx",
];

const DEMO_CALCULATOR_VISIBLE_CHROME_KEYS = [
  "quickPreferences.title",
  "preferences.interfaceLanguage",
  "preferences.lengthUnit",
  "preferences.volumeUnit",
  "calculator.referenceMeasurements",
  "calculator.moldBoundary",
  "calculator.woodIslands",
  "calculator.resinCavities",
  "calculator.advancedDetails",
  "calculator.viewNavigation",
  "calculator.zoomIn",
  "calculator.editDepth",
  "calculator.cavityDepthsAndVolumes",
  "calculator.calculateResinVolume",
  "calculator.result.totalResinRequired",
  "calculator.result.recommendedAmountTenPercent",
  "calculator.projectNotes",
  "calculator.planning.optionalToolsTitle",
  "calculator.planning.firstFillTitle",
  "calculator.planning.pourLayerTitle",
  "calculator.result.detailedBreakdown",
  "calculator.projectActions",
  "calculator.exportPdf",
];

const MOLD = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
const WOOD = [
  { x: 10, y: 10 },
  { x: 40, y: 10 },
  { x: 40, y: 40 },
  { x: 10, y: 40 },
];
const CAVITY = [
  { x: 60, y: 60 },
  { x: 90, y: 60 },
  { x: 90, y: 90 },
  { x: 60, y: 90 },
];

const WOOD_RESULT = {
  calculationType: "wood",
  volumeLiters: 2.5,
  recommendedVolumeLiters: 2.75,
  safetyMarginPercent: 10,
  moldAreaCm2: 100,
  woodAreaCm2: 20,
  woodIslandCount: 1,
  mainResinAreaCm2: 80,
  mainVolumeLiters: 2,
  cavityAreaCm2: 4,
  mainPourDepthMm: 10,
  useImageBorderAsMold: false,
};

function collectDemoCalculatorRequiredKeys() {
  return [
    ...new Set([
      ...collectLiteralKeysFromFiles(DEMO_CALCULATOR_SOURCE_FILES),
      ...DEMO_CALCULATOR_DYNAMIC_UI_KEYS,
    ]),
  ].sort();
}

function buildCompletedDemoSnapshot() {
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    calibration: {
      referenceMeasurements: [
        {
          knownLengthCm: 10,
          calibrationPoints: [
            { x: 5, y: 50 },
            { x: 5, y: 80 },
          ],
        },
      ],
    },
    ui: {
      calculationMode: "wood",
      selectedMode: "edit",
      rotationDeg: 0,
      measurementsComplete: true,
      cavitiesComplete: true,
    },
    woodBoundaryMode: {
      ...VALID_CALCULATOR_SNAPSHOT.woodBoundaryMode,
      useImageBorderAsMold: false,
      moldBoundaryPoints: MOLD,
      woodBoundaryPolygons: [WOOD],
      cavities: [{ name: "Cavity 1", points: CAVITY, depthMm: "12" }],
      cavityDepthsMm: ["12"],
      mainResinDepthMm: "20",
      firstFillThicknessMm: "3",
      firstFillVolumeLiters: 0.0252,
      pourPlanRows: [
        {
          label: "Pour 1 — First Fill Seal Coat",
          type: "firstFill",
          thicknessMm: 3,
          volumeLiters: 0.0252,
          recommendedVolumeLiters: 0.02772,
        },
        {
          label: "Pour 2",
          type: "mainPour",
          thicknessMm: 8.5,
          volumeLiters: 0.0714,
          recommendedVolumeLiters: 0.07854,
        },
      ],
    },
    result: {
      ...WOOD_RESULT,
      cavities: [{ name: "Cavity 1", areaCm2: 4, depthMm: 12, volumeLiters: 0.048 }],
    },
  };
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

function installImageMock() {
  const OriginalImage = global.Image;
  global.Image = class MockImage {
    constructor() {
      this.width = 200;
      this.height = 200;
    }
    set src(_value) {
      if (this.onload) {
        this.onload();
      }
    }
  };
  return () => {
    global.Image = OriginalImage;
  };
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
}

function expectVisibleCopy(text) {
  expect(screen.getAllByText(text).length).toBeGreaterThanOrEqual(1);
}

function renderDemoCalculator() {
  const ref = createRef();
  render(
    <TestProviders>
      <QuickPreferences variant="workspace" />
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
        enforceAccountCapabilities={false}
      />
    </TestProviders>,
  );
  return ref;
}

describe("Guest authentication localization completeness", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("covers literal t() keys used by login and password recovery", () => {
    const extracted = collectLiteralKeysFromFiles(GUEST_AUTH_SOURCE_FILES);
    expect(extracted.length).toBeGreaterThan(0);
    for (const key of extracted) {
      expect(GUEST_AUTH_UI_KEYS).toContain(key);
    }
  });

  it("requires every guest auth key in each active public locale bundle", () => {
    const activePublicLocales = loadActivePublicLocales();
    const uniqueKeys = [...new Set(GUEST_AUTH_UI_KEYS)];

    for (const locale of activePublicLocales) {
      for (const key of uniqueKeys) {
        expect(localeBundleHasOwnKey(locale, key), `${locale} missing ${key}`).toBe(true);
        const value = translate(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }

    for (const locale of activePublicLocales.filter((code) => code !== "en")) {
      expect(translate(locale, "login.title")).not.toBe(translate("en", "login.title"));
      expect(translate(locale, "recovery.title")).not.toBe(translate("en", "recovery.title"));
      expect(translate(locale, "login.forgotPassword")).not.toBe(translate("en", "login.forgotPassword"));
    }
  });

  it("renders English login and password recovery chrome from owned keys", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.LOGIN);

    expect(await screen.findByRole("heading", { name: "Log in to HFZWood", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email or username" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toBeInTheDocument();

    cleanup();
    renderWorkspace(ROUTES.PASSWORD_RECOVERY);
    expect(screen.getByRole("heading", { name: "Reset your password", level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter the email address associated with your account and we will send you instructions to reset your password.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send recovery instructions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Log in" })).toBeInTheDocument();
  });

  it("renders Romanian login and password recovery chrome from owned keys", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.LOGIN);

    expect(
      await screen.findByRole("heading", { name: "Autentificare în HFZWood", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "E-mail sau nume de utilizator" })).toBeInTheDocument();
    expect(screen.getByLabelText("Parolă")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Autentifică-te" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Creează un cont" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ți-ai uitat parola?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Log in to HFZWood", level: 2 })).not.toBeInTheDocument();

    cleanup();
    renderWorkspace(ROUTES.PASSWORD_RECOVERY);
    expect(screen.getByRole("heading", { name: "Resetează parola", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trimite instrucțiunile de recuperare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Înapoi la autentificare" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reset your password", level: 2 })).not.toBeInTheDocument();
  });

  it("renders French login and password recovery chrome without English fallback", async () => {
    const user = userEvent.setup();
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "fr" });
    renderWorkspace(ROUTES.LOGIN);

    expect(await screen.findByRole("heading", { name: "Connexion à HFZWood", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "E-mail ou nom d’utilisateur" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connectez-vous" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Créer un compte" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mot de passe oublié ?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Log in to HFZWood", level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Forgot your password?" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connectez-vous" }));
    expect(screen.getByRole("alert")).toHaveTextContent("L’e-mail ou le nom d’utilisateur est obligatoire.");

    cleanup();
    renderWorkspace(ROUTES.PASSWORD_RECOVERY);
    expect(
      screen.getByRole("heading", { name: "Réinitialiser votre mot de passe", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Saisissez l’adresse e-mail associée à votre compte et nous vous enverrons les instructions pour réinitialiser votre mot de passe.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Envoyer les instructions de récupération" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à la connexion" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reset your password", level: 2 })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send recovery instructions" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Envoyer les instructions de récupération" }));
    expect(screen.getByRole("alert")).toHaveTextContent("L’e-mail est obligatoire.");

    await user.type(screen.getByRole("textbox", { name: /E-mail/ }), "guest@example.com");
    await user.click(screen.getByRole("button", { name: "Envoyer les instructions de récupération" }));
    expect(
      await screen.findByText(
        "Saisissez le code de confirmation envoyé à guest@example.com et choisissez un nouveau mot de passe.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmez le nouveau mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre à jour le mot de passe" })).toBeInTheDocument();
  });
});

describe("Demo calculator localization completeness", () => {
  let restoreImage;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    restoreImage = installImageMock();
    mockCapabilitiesFetch({ activePublicLocales: ["en", "ro", "fr"] });
  });

  afterEach(() => {
    restoreImage?.();
    cleanup();
  });

  it("covers calculator t() keys plus dynamic polygon-kind keys", () => {
    const requiredKeys = collectDemoCalculatorRequiredKeys();
    expect(requiredKeys.length).toBeGreaterThan(50);
    for (const key of DEMO_CALCULATOR_DYNAMIC_UI_KEYS) {
      expect(requiredKeys).toContain(key);
    }
    expect(requiredKeys).toContain("quickPreferences.title");
    expect(requiredKeys).toContain("calculator.advancedDetails");
    expect(requiredKeys).toContain("calculator.exportPdf");
  });

  it("requires every demo calculator key in each active public locale bundle", () => {
    const activePublicLocales = loadActivePublicLocales();
    const requiredKeys = collectDemoCalculatorRequiredKeys();

    for (const locale of activePublicLocales) {
      for (const key of requiredKeys) {
        expect(localeBundleHasOwnKey(locale, key), `${locale} missing ${key}`).toBe(true);
        const value = translate(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }

    for (const locale of activePublicLocales.filter((code) => code !== "en")) {
      for (const key of DEMO_CALCULATOR_VISIBLE_CHROME_KEYS) {
        expect(translate(locale, key), `${locale} still English for ${key}`).not.toBe(
          translate("en", key),
        );
      }
    }
  });

  it("renders English demo calculator chrome from owned keys", async () => {
    seedDevicePreferences({ interfaceLanguage: "en" });
    const ref = renderDemoCalculator();
    await restoreSnapshot(ref, buildCompletedDemoSnapshot());

    expect(await screen.findByText("Quick preferences")).toBeInTheDocument();
    expectVisibleCopy("Reference Measurements");
    expectVisibleCopy("Mold Boundary");
    expectVisibleCopy("Wood Islands");
    expectVisibleCopy("Resin Cavities");
    expect(screen.getByText("Advanced Details")).toBeInTheDocument();
    expect(screen.getByText("Cavity Depths & Volumes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Depth" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculate Resin Volume" })).toBeInTheDocument();
    expect(screen.getByText("Total Resin Required:")).toBeInTheDocument();
    expect(screen.getByText("Recommended Amount (+10%):")).toBeInTheDocument();
    expect(screen.getByText("Project Notes")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Optional Pour Planning Tools", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "First Fill Seal Coat Calculator", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pour Layer Planning", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Detailed Breakdown")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Project Actions", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
    expect(screen.getByText("View & Navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom In" })).toBeInTheDocument();
    expectVisibleCopy("Cavity 1");
    expect(screen.getByText("Pour 1 — First Fill Seal Coat")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Component A" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Component B" })).toBeInTheDocument();
    expect(
      screen.getByText("Wood | edit | Refs: 1 | Modify | Zoom: 100% | Rot: 0°"),
    ).toBeInTheDocument();
  });

  it("renders Romanian demo calculator chrome from owned keys", async () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    const ref = renderDemoCalculator();
    await restoreSnapshot(ref, buildCompletedDemoSnapshot());

    expect(await screen.findByText("Preferințe rapide")).toBeInTheDocument();
    expectVisibleCopy("Măsurători de referință");
    expectVisibleCopy("Contur cofraj");
    expectVisibleCopy("Insule de lemn");
    expectVisibleCopy("Cavități de rășină");
    expect(screen.getByText("Detalii avansate")).toBeInTheDocument();
    expect(screen.getByText("Adâncimi și volume ale cavităților")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editează adâncimea" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculează volumul de rășină" })).toBeInTheDocument();
    expect(screen.getByText("Rășină totală necesară:")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Instrumente opționale de planificare a turnării", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acțiuni proiect", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportă PDF" })).toBeDisabled();
    expectVisibleCopy("Cavitate 1");
    expect(screen.getByText("Turn 1 — Strat sigilant prim turn")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Componenta A" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Componenta B" })).toBeInTheDocument();
    expect(
      screen.getByText("Lemn | editare | Ref.: 1 | Modificare | Zoom: 100% | Rot: 0°"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Cavity 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Pour 1 — First Fill Seal Coat")).not.toBeInTheDocument();
    expect(screen.queryByText("Quick preferences")).not.toBeInTheDocument();
    expect(screen.queryByText("Advanced Details")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export PDF" })).not.toBeInTheDocument();
  });

  it("renders French demo calculator chrome without English fallback", async () => {
    seedDevicePreferences({ interfaceLanguage: "fr" });
    const ref = renderDemoCalculator();
    await restoreSnapshot(ref, buildCompletedDemoSnapshot());

    expect(await screen.findByText("Préférences rapides")).toBeInTheDocument();
    expect(screen.getByText("Langue de l’interface")).toBeInTheDocument();
    expectVisibleCopy("Mesures de référence");
    expectVisibleCopy("Contour du moule");
    expectVisibleCopy("Îlots de bois");
    expectVisibleCopy("Cavités de résine");
    expect(screen.getByText("Détails avancés")).toBeInTheDocument();
    expect(screen.getByText("Profondeurs et volumes des cavités")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier la profondeur" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculer le volume de résine" })).toBeInTheDocument();
    expect(screen.getByText("Résine totale requise :")).toBeInTheDocument();
    expect(screen.getByText("Quantité recommandée (+10 %) :")).toBeInTheDocument();
    expect(screen.getByText("Notes du projet")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Outils optionnels de planification de coulée", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Calculateur de couche d’étanchéité du premier coulage",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Planification des couches de coulée", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Détail complet")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actions du projet", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exporter en PDF" })).toBeDisabled();
    expect(screen.getByText("Affichage et navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom avant" })).toBeInTheDocument();
    expect(screen.getByText("Estimation du coût du projet")).toBeInTheDocument();
    expectVisibleCopy("Cavité 1");
    expect(
      screen.getByText("Coulée 1 — Couche d’étanchéité du premier coulage"),
    ).toBeInTheDocument();
    expect(screen.getByText("Coulée 2")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Composant A" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Composant B" })).toBeInTheDocument();
    expect(
      screen.getByText("Bois | édition | Réf. : 1 | Modification | Zoom : 100% | Rot. : 0°"),
    ).toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.cavities[0].name).toBe("Cavity 1");
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.pourPlanRows[0].label).toBe(
      "Pour 1 — First Fill Seal Coat",
    );

    expect(screen.queryByText("Cavity 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Pour 1 — First Fill Seal Coat")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Component A" })).not.toBeInTheDocument();
    expect(screen.queryByText("Wood | edit | Refs: 1 | Modify | Zoom: 100% | Rot: 0°")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference Measurements")).not.toBeInTheDocument();
    expect(screen.queryByText("Mold Boundary")).not.toBeInTheDocument();
    expect(screen.queryByText("Wood Islands")).not.toBeInTheDocument();
    expect(screen.queryByText("Resin Cavities")).not.toBeInTheDocument();
    expect(screen.queryByText("Advanced Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Cavity Depths & Volumes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Depth" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Calculate Resin Volume" })).not.toBeInTheDocument();
    expect(screen.queryByText("Total Resin Required:")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional Pour Planning Tools")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export PDF" })).not.toBeInTheDocument();
    expect(screen.queryByText("View & Navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zoom In" })).not.toBeInTheDocument();
  });
});
