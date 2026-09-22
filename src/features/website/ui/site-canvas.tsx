import { countdownLabel, daysUntil } from "@/features/website/domain/countdown";
import { getBlock } from "@/features/website/domain/registry";
import { getTemplate } from "@/features/website/domain/templates";
import type {
  SiteDocument,
  SiteSection,
  TemplateDefinition,
  ThemeTokens,
} from "@/features/website/domain/types";
import { safeHttpsUrl } from "@/features/website/domain/urls";
import { displayStyle, themeStyle } from "@/features/website/ui/styles";

export type PreviewViewport = "desktop" | "mobile";

type CanvasProps = {
  site: SiteDocument;
  viewport: PreviewViewport;
};

export function SiteCanvas({ site, viewport }: CanvasProps) {
  const template = getTemplate(site.presentation.templateId);
  const theme = site.presentation.theme;
  const sections = site.sections
    .filter((section) => section.enabled)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const pad = viewport === "mobile" ? "px-5 py-10" : "px-12 py-16";
  const align = template.align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <article
      data-template={template.id}
      data-viewport={viewport}
      style={themeStyle(theme)}
      className={`flex min-h-full flex-col ${align}`}
    >
      {sections.map((section) => (
        <section
          key={`${section.id}-${section.sortOrder}`}
          aria-label={getBlock(section.type).label}
          data-section-type={section.type}
          className={`motion-safe:animate-[fadeRise_400ms_ease-out] w-full ${pad} ${
            template.showRules ? "border-t first:border-t-0" : ""
          }`}
          style={{ borderColor: theme.accentSecondary }}
        >
          <SectionBody section={section} template={template} theme={theme} viewport={viewport} />
        </section>
      ))}
    </article>
  );
}

function SectionBody({
  section,
  template,
  theme,
  viewport,
}: {
  section: SiteSection;
  template: TemplateDefinition;
  theme: ThemeTokens;
  viewport: PreviewViewport;
}) {
  switch (section.type) {
    case "hero":
      return <Hero content={section.content} template={template} theme={theme} viewport={viewport} />;
    case "countdown":
      return <Countdown content={section.content} template={template} theme={theme} viewport={viewport} />;
    case "story":
      return <Story content={section.content} template={template} theme={theme} />;
    case "events":
      return <Events content={section.content} template={template} theme={theme} viewport={viewport} />;
    case "venue":
      return <Venue content={section.content} template={template} theme={theme} />;
    case "gallery":
      return <Gallery content={section.content} template={template} theme={theme} viewport={viewport} />;
    case "dress_code":
      return <DressCode content={section.content} template={template} theme={theme} />;
    case "faq":
      return <Faq content={section.content} template={template} theme={theme} />;
    case "registry":
      return <Registry content={section.content} template={template} theme={theme} />;
    case "rsvp":
      return <Rsvp content={section.content} template={template} theme={theme} />;
    case "footer":
      return <Footer content={section.content} template={template} theme={theme} />;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

function eyebrowClass(template: TemplateDefinition): string {
  return template.uppercaseEyebrow
    ? "text-xs uppercase tracking-[0.22em]"
    : "text-sm tracking-wide";
}

function heroTitleClass(template: TemplateDefinition, viewport: PreviewViewport): string {
  if (template.tracking === "luxury") {
    return `uppercase tracking-[0.22em] ${viewport === "mobile" ? "text-3xl" : "text-5xl"}`;
  }
  if (template.id === "minimal") {
    return `font-medium uppercase tracking-[0.18em] ${viewport === "mobile" ? "text-3xl" : "text-5xl"}`;
  }
  const size = viewport === "mobile" ? "text-4xl" : "text-6xl";
  const italic = template.italicDisplay ? "italic" : "";
  const track = template.tracking === "wide" ? "tracking-wide" : "";
  return `${size} leading-[1.02] ${italic} ${track}`;
}

function headingClass(template: TemplateDefinition): string {
  const italic = template.italicDisplay ? "italic" : "";
  const luxury = template.tracking === "luxury" ? "uppercase tracking-[0.18em] text-2xl" : "text-3xl";
  return `${luxury} ${italic}`;
}

function Hero({
  content,
  template,
  theme,
  viewport,
}: {
  content: Extract<SiteSection, { type: "hero" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
  viewport: PreviewViewport;
}) {
  const onPhoto = template.heroLayout === "overlay" && viewport === "desktop";
  const ink = onPhoto ? "#f7f1ea" : theme.ink;
  const muted = onPhoto ? "#f3e6dc" : theme.muted;
  const accent = onPhoto ? "#f7f1ea" : theme.accent;

  const text = (
    <div className={`flex max-w-xl flex-col gap-4 ${template.align === "center" ? "items-center" : "items-start"}`}>
      {content.eyebrow ? (
        <p className={eyebrowClass(template)} style={{ color: accent }}>
          {content.eyebrow}
        </p>
      ) : null}
      <h1 className={heroTitleClass(template, viewport)} style={{ ...displayStyle(theme), color: ink }}>
        {content.title || "Votre mariage"}
      </h1>
      {content.dateLabel ? <p style={{ color: muted }}>{content.dateLabel}</p> : null}
      {content.subtitle ? <p className="max-w-md text-lg leading-relaxed">{content.subtitle}</p> : null}
    </div>
  );

  const media = (
    <Media
      url={content.imageUrl}
      alt={content.imageAlt}
      theme={theme}
      className={viewport === "mobile" ? "min-h-48" : "min-h-72"}
    />
  );

  if (template.heroLayout === "split") {
    return (
      <div className={viewport === "desktop" ? "grid w-full grid-cols-2 items-center gap-10" : "flex w-full flex-col gap-8"}>
        {text}
        {media}
      </div>
    );
  }

  if (template.heroLayout === "overlay" && viewport === "desktop") {
    return (
      <div className="relative min-h-[28rem] w-full overflow-hidden">
        <div className="absolute inset-0">{media}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="relative flex min-h-[28rem] items-end p-2">{text}</div>
      </div>
    );
  }

  if (template.heroLayout === "plain") {
    return <div className="w-full">{text}</div>;
  }

  return (
    <div className={`flex w-full flex-col gap-8 ${template.align === "center" ? "items-center" : "items-start"}`}>
      {text}
      {template.heroLayout === "centered" ? media : null}
    </div>
  );
}

function Media({
  url,
  alt,
  theme,
  className,
}: {
  url: string;
  alt: string;
  theme: ThemeTokens;
  className: string;
}) {
  const src = safeHttpsUrl(url);
  if (!src) {
    return (
      <div
        className={`flex w-full items-end ${className} p-4 text-sm`}
        style={{ backgroundColor: theme.surface, color: theme.muted }}
      >
        {alt || "Photo à venir"}
      </div>
    );
  }

  return (
    // Couple-supplied https URLs are not declared in next/image remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`w-full object-cover ${className}`} />
  );
}

function Countdown({
  content,
  template,
  theme,
  viewport,
}: {
  content: Extract<SiteSection, { type: "countdown" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
  viewport: PreviewViewport;
}) {
  const label = countdownLabel(daysUntil(content.targetDate, new Date()));
  return (
    <div className={`flex w-full flex-col gap-3 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Compte à rebours"}
      </h2>
      <p
        className={viewport === "mobile" ? "text-4xl" : "text-5xl"}
        style={{ ...displayStyle(theme), color: theme.accent }}
      >
        {label}
      </p>
      {content.message ? <p style={{ color: theme.muted }}>{content.message}</p> : null}
    </div>
  );
}

function Story({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "story" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className={`mx-auto flex w-full max-w-xl flex-col gap-4 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Histoire"}
      </h2>
      {content.body ? <p className="whitespace-pre-wrap leading-relaxed">{content.body}</p> : null}
    </div>
  );
}

function Events({
  content,
  template,
  theme,
  viewport,
}: {
  content: Extract<SiteSection, { type: "events" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
  viewport: PreviewViewport;
}) {
  const grid = viewport === "desktop" && template.id === "modern";
  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Événements"}
      </h2>
      <ul className={grid ? "grid w-full grid-cols-3 gap-4" : "flex w-full flex-col gap-5"}>
        {content.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 px-4 py-3"
            style={{ backgroundColor: theme.surface }}
          >
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
              {item.dateTimeLabel}
            </p>
            <p className="text-xl" style={displayStyle(theme)}>
              {item.title}
            </p>
            {item.location ? <p>{item.location}</p> : null}
            {item.description ? <p style={{ color: theme.muted }}>{item.description}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Venue({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "venue" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className={`flex w-full flex-col gap-3 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Lieu"}
      </h2>
      <p className="text-2xl" style={displayStyle(theme)}>
        {content.name}
      </p>
      {content.address ? <p className="whitespace-pre-wrap">{content.address}</p> : null}
      {content.note ? <p style={{ color: theme.muted }}>{content.note}</p> : null}
    </div>
  );
}

function Gallery({
  content,
  template,
  theme,
  viewport,
}: {
  content: Extract<SiteSection, { type: "gallery" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
  viewport: PreviewViewport;
}) {
  const columns = viewport === "desktop" ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Galerie"}
      </h2>
      <ul className={`grid w-full gap-3 ${columns}`}>
        {content.images.map((image) => (
          <li key={image.id}>
            <Media url={image.imageUrl} alt={image.alt} theme={theme} className="min-h-36" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DressCode({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "dress_code" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className={`flex w-full flex-col gap-4 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Tenue"}
      </h2>
      {content.description ? <p className="max-w-xl leading-relaxed">{content.description}</p> : null}
      {content.palette.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {content.palette.map((color) => (
            <li
              key={color}
              className="border px-3 py-1 text-sm"
              style={{ borderColor: theme.accentSecondary, color: theme.ink }}
            >
              {color}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Faq({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "faq" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Questions"}
      </h2>
      <div className="flex w-full flex-col">
        {content.items.map((item) => (
          <details key={item.id} className="border-t py-3" style={{ borderColor: theme.accentSecondary }}>
            <summary className="cursor-pointer text-lg" style={displayStyle(theme)}>
              {item.question}
            </summary>
            <p className="pt-2 leading-relaxed" style={{ color: theme.muted }}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function Registry({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "registry" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className={`flex w-full flex-col gap-4 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "Liste de mariage"}
      </h2>
      {content.intro ? <p className="max-w-xl" style={{ color: theme.muted }}>{content.intro}</p> : null}
      <ul className="flex flex-col gap-2">
        {content.links.map((link) => {
          const href = safeHttpsUrl(link.url);
          return (
            <li key={link.id}>
              {href ? (
                <a href={href} rel="noreferrer" style={{ color: theme.accent }} className="underline-offset-4 hover:underline">
                  {link.label || href}
                </a>
              ) : (
                <span>{link.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Rsvp({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "rsvp" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <div className={`flex w-full flex-col gap-4 ${template.align === "center" ? "items-center" : "items-start"}`}>
      <h2 className={headingClass(template)} style={displayStyle(theme)}>
        {content.heading || "RSVP"}
      </h2>
      {content.intro ? <p className="max-w-xl leading-relaxed">{content.intro}</p> : null}
      {content.deadlineLabel ? <p style={{ color: theme.muted }}>{content.deadlineLabel}</p> : null}
      <span
        className="inline-flex px-5 py-2.5 text-sm tracking-wide"
        style={{ backgroundColor: theme.accent, color: theme.background }}
      >
        {content.buttonLabel || "Répondre"}
      </span>
    </div>
  );
}

function Footer({
  content,
  template,
  theme,
}: {
  content: Extract<SiteSection, { type: "footer" }>["content"];
  template: TemplateDefinition;
  theme: ThemeTokens;
}) {
  return (
    <footer className={`flex w-full flex-col gap-2 ${template.align === "center" ? "items-center" : "items-start"}`}>
      {content.showMonogram ? (
        <p className="text-3xl tracking-[0.2em]" style={displayStyle(theme)}>
          {monogram(content.names)}
        </p>
      ) : null}
      <p style={displayStyle(theme)}>{content.names}</p>
      {content.dateLabel ? <p style={{ color: theme.muted }}>{content.dateLabel}</p> : null}
      {content.note ? <p style={{ color: theme.accent }}>{content.note}</p> : null}
    </footer>
  );
}

function monogram(names: string): string {
  const parts = names
    .split(/\s*(?:&|et)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts.map((part) => part[0]?.toLocaleUpperCase("fr") ?? "").join(" ");
  return initials || "·";
}
