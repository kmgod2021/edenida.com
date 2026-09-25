import { ModuleEmptyState } from "./module-empty-state";

const MODULE_COPY = {
  website: {
    title: "Site web",
    description:
      "Le constructeur de site n'est pas encore relié. Quand il le sera, vous choisirez un modèle et publierez une adresse — le contenu reste séparé de la présentation.",
  },
  guests: {
    title: "Invités",
    description:
      "La liste d'invités n'est pas encore reliée. Aucune donnée d'invité n'est affichée ni enregistrée ici.",
  },
  planning: {
    title: "Planning",
    description:
      "Le planning n'est pas encore relié. Les tâches apparaîtront ici, à partir de la date du mariage.",
  },
  budget: {
    title: "Budget",
    description:
      "Le budget n'est pas encore relié. Les montants prévus et réels resteront dans votre espace.",
  },
  vendors: {
    title: "Prestataires",
    description:
      "Les prestataires ne sont pas encore reliés. Ce n'est pas une marketplace : seulement votre liste, plus tard.",
  },
} as const;

export type WorkspaceModuleId = keyof typeof MODULE_COPY;

export function WorkspaceModulePlaceholder({
  moduleId,
  weddingId,
}: {
  moduleId: WorkspaceModuleId;
  weddingId: string;
}) {
  const copy = MODULE_COPY[moduleId];
  return (
    <ModuleEmptyState
      title={copy.title}
      description={copy.description}
      actionHref={`/app/weddings/${weddingId}`}
      actionLabel="Retour au tableau de bord"
    />
  );
}
