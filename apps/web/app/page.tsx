"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { ChatWidget } from "../components/ChatWidget";
import { Logo } from "../components/Logo";
import { QuoteCard } from "../components/QuoteCard";
import { useConversation } from "../lib/useConversation";
import {
  ArrowRightIcon,
  ClockIcon,
  CpuIcon,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  MailIcon,
  MessageSquareIcon,
  ShieldIcon,
  SparkleIcon,
  TargetIcon,
  UsersIcon,
} from "../components/icons";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const PAIN_POINTS = [
  {
    icon: <ClockIcon size={22} />,
    title: "Hours, not minutes",
    body: "A manually-quoted RFQ can sit in a WhatsApp inbox for hours before anyone gets to it.",
  },
  {
    icon: <UsersIcon size={22} />,
    title: "3-4 competitors, same request",
    body: "Buyers routinely ask several suppliers the same question at once - they aren't waiting on you.",
  },
  {
    icon: <TargetIcon size={22} />,
    title: "First reply wins",
    body: "By the time your team responds, the order is already gone - to whoever answered first, not cheapest.",
  },
];

const STEPS = [
  {
    icon: <LayersIcon size={20} />,
    title: "Ingest",
    body: "WhatsApp, email, or your website chat - every RFQ lands in one place, normalized the same way.",
  },
  {
    icon: <SparkleIcon size={20} />,
    title: "Parse",
    body: "An LLM extracts item, quantity, spec and deadline - English/Roman Urdu handled natively. Missing fields are never guessed.",
  },
  {
    icon: <TargetIcon size={20} />,
    title: "Match & price",
    body: "Fuzzy-matched against your catalog, priced with deterministic tiered discounts - price math runs in code, not inside a model.",
  },
  {
    icon: <ShieldIcon size={20} />,
    title: "Confidence check",
    body: "High-confidence quotes go out immediately. Anything uncertain - unmatched item, missing detail, out of stock - is flagged with the exact reason.",
  },
  {
    icon: <UsersIcon size={20} />,
    title: "Reply or review",
    body: "Auto-sent quotes are logged for your team to see. Flagged ones wait in a queue staff can approve, edit, or take over live.",
  },
];

const ARCHITECTURE_POINTS = [
  "A confidence orchestrator decides auto-send vs. human review - it never routes on a guess.",
  "Specialized agents for each stage: parsing, catalog matching, pricing, and drafting.",
  "Deterministic pricing stays in code - the LLM never does the arithmetic.",
];

const CHANNELS = [
  {
    icon: <MessageSquareIcon size={22} />,
    title: "WhatsApp Business",
    body: "Answer buyers exactly where they already are, without anyone at the counter typing a single quote by hand.",
  },
  {
    icon: <MailIcon size={22} />,
    title: "Email",
    body: "Point an inbox at it - every reply gets the same structured parsing, pricing, and confidence routing.",
  },
  {
    icon: <GlobeIcon size={22} />,
    title: "Website chat",
    body: "An embeddable widget for your own site - visitors get a real number back without waiting for a human.",
  },
];

const FEATURES = [
  { icon: <ShieldIcon size={18} />, title: "Confidence-based routing", body: "Never auto-sends a quote it isn't sure about." },
  { icon: <LayersIcon size={18} />, title: "Full audit trail", body: "Every quote, sent or reviewed, logged with the reasoning behind it." },
  { icon: <TargetIcon size={18} />, title: "Deterministic pricing", body: "Tiered discounts run in code - never left to a language model's arithmetic." },
  { icon: <UsersIcon size={18} />, title: "Human-in-the-loop", body: "Staff can take over any live conversation instantly, no hand-off delay." },
  { icon: <LockIcon size={18} />, title: "Never fabricates stock", body: "No price, no promise, unless the data actually backs it up." },
  { icon: <CpuIcon size={18} />, title: "Multi-model", body: "Built on Claude or Gemini - swappable per deployment, no lock-in." },
];

const DEMO_QUOTE = {
  type: "quote" as const,
  item: "Inverex Jollywood 620W steel frame solar panel",
  sku: "INV-JW-620W",
  quantity: 10,
  unit: null,
  spec: "620W, steel frame",
  inStock: true,
  priceBreakdown: {
    unitPrice: 27500,
    quantity: 10,
    subtotal: 275000,
    discountPct: 0,
    discountAmount: 0,
    handlingFee: 0,
    total: 275000,
  },
};

const STATS = [
  { value: 2, suffix: " min", label: "Target average reply time" },
  { value: 3, suffix: "", label: "Channels unified in one queue" },
  { value: 100, suffix: "%", label: "Of quotes logged for audit - sent or reviewed" },
];

export default function MarketingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { messages, send, isThinking } = useConversation();

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.6 })
        .from(".hero-h1", { opacity: 0, y: 24, duration: 0.7 }, "-=0.35")
        .from(".hero-sub", { opacity: 0, y: 20, duration: 0.6 }, "-=0.4")
        .from(".hero-ctas", { opacity: 0, y: 16, duration: 0.5 }, "-=0.35")
        .from(".hero-trust", { opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".hero-visual", { opacity: 0, x: 40, duration: 0.8 }, "-=0.7");

      gsap.utils.toArray<HTMLElement>(".problem-card").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.6,
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".step-row").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: -30,
          duration: 0.6,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      gsap.to(".line-fill", {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: ".steps-wrap",
          start: "top 60%",
          end: "bottom 70%",
          scrub: 0.5,
        },
      });

      gsap.utils.toArray<SVGLineElement>(".arch-line").forEach((el, i) => {
        gsap.set(el, { strokeDashoffset: 1000 });
        gsap.to(el, {
          strokeDashoffset: 0,
          duration: 0.7,
          delay: i * 0.05,
          ease: "power2.out",
          scrollTrigger: { trigger: ".arch-diagram", start: "top 80%" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".arch-node").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          scale: 0.85,
          duration: 0.5,
          delay: 0.2 + i * 0.05,
          scrollTrigger: { trigger: ".arch-diagram", start: "top 80%" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".channel-card").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.6,
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          scale: 0.94,
          duration: 0.5,
          delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      gsap.from(".demo-visual", {
        opacity: 0,
        y: 30,
        duration: 0.7,
        scrollTrigger: { trigger: ".demo-visual", start: "top 85%" },
      });

      gsap.utils.toArray<HTMLElement>(".stat-number").forEach((el) => {
        const target = Number(el.dataset.value ?? "0");
        const suffix = el.dataset.suffix ?? "";
        const counter = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () =>
            gsap.to(counter, {
              val: target,
              duration: 1.3,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(counter.val) + suffix;
              },
            }),
        });
      });

      gsap.from(".cta-fade", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        scrollTrigger: { trigger: ".cta-fade", start: "top 85%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={pageStyle}>
      <nav style={navStyle}>
        <div style={navBrandStyle}>
          <Logo size={26} />
          Rfqly
        </div>
        <div style={navLinksStyle}>
          <a href="#how-it-works" style={navLinkStyle}>How it works</a>
          <a href="#architecture" style={navLinkStyle}>Architecture</a>
          <a href="#channels" style={navLinkStyle}>Channels</a>
          <a href="#why-agentic" style={navLinkStyle}>Why agentic</a>
          <a href="/demo" style={navCtaStyle}>Try live demo</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={heroSectionStyle}>
        <div style={heroGridStyle}>
          <div>
            <div className="hero-eyebrow" style={eyebrowStyle}>
              AGENTIC AUTOMATION &middot; BUILT FOR DISTRIBUTORS &amp; WHOLESALERS
            </div>
            <h1 className="hero-h1" style={h1Style}>
              Your RFQs deserve a reply in minutes, not hours.
            </h1>
            <p className="hero-sub" style={heroSubStyle}>
              We design and ship AI agents that read incoming requests, check your stock and price, and reply -
              on WhatsApp, email, and your own website chat - before your competitors even open the message.
            </p>
            <div className="hero-ctas" style={heroCtasStyle}>
              <a href="/demo" style={primaryBtnStyle}>
                Try the live demo <ArrowRightIcon size={16} />
              </a>
              <a href="#how-it-works" style={secondaryBtnStyle}>
                See how it works
              </a>
            </div>
            <div className="hero-trust" style={trustRowStyle}>
              <TrustBadge icon={<MessageSquareIcon size={14} />} label="WhatsApp" />
              <TrustBadge icon={<MailIcon size={14} />} label="Email" />
              <TrustBadge icon={<GlobeIcon size={14} />} label="Website Chat" />
            </div>
          </div>

          <div className="hero-visual" style={heroVisualWrapStyle}>
            <div style={heroVisualCardStyle}>
              <div style={heroVisualHeaderStyle}>
                <Logo size={24} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Rfqly</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={buyerBubbleMini}>Need 10 Inverex Jollywood 620W panels, price?</div>
                <QuoteCard meta={DEMO_QUOTE} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={sectionStyle}>
        <SectionHeading eyebrow="THE REAL PROBLEM" title="It was never your pricing." subtitle="It's how fast you reply. The first credible answer usually wins the order - regardless of who's cheapest." />
        <div style={threeColGridStyle}>
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className="problem-card" style={painCardStyle}>
              <div style={iconBadgeStyle}>{p.icon}</div>
              <h3 style={cardTitleStyle}>{p.title}</h3>
              <p style={cardBodyStyle}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={sectionStyle}>
        <SectionHeading eyebrow="HOW IT WORKS" title="One pipeline, every channel." subtitle="The same agentic pipeline handles WhatsApp, email, and website chat - structured the same way end to end." />
        <div className="steps-wrap" style={stepsWrapStyle}>
          <div style={lineTrackStyle}>
            <div className="line-fill" style={lineFillStyle} />
          </div>
          {STEPS.map((s, i) => (
            <div key={s.title} className="step-row" style={stepRowStyle}>
              <div style={stepIconStyle}>{s.icon}</div>
              <div>
                <div style={stepNumberStyle}>STEP {i + 1}</div>
                <h3 style={cardTitleStyle}>{s.title}</h3>
                <p style={cardBodyStyle}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agentic architecture */}
      <section id="architecture" style={sectionStyle}>
        <div style={archGridStyle}>
          <div>
            <div style={sectionEyebrowStyle}>UNDER THE HOOD</div>
            <h2 style={{ ...sectionTitleStyle, textAlign: "left" }}>Built as a supervised multi-agent pipeline.</h2>
            <p style={{ ...sectionSubtitleStyle, textAlign: "left", marginBottom: 20 }}>
              Not one giant prompt trying to do everything - a supervisor orchestrates specialized agents, each
              with its own tool, so the parts that must be exact (pricing, stock) never depend on a model's
              arithmetic.
            </p>
            <ul style={archListStyle}>
              {ARCHITECTURE_POINTS.map((point) => (
                <li key={point} style={archListItemStyle}>
                  <span style={archBulletStyle} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="arch-diagram">
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* Channels */}
      <section id="channels" style={sectionStyle}>
        <SectionHeading eyebrow="EVERY CHANNEL, ONE AGENT" title="Wherever buyers ask, it answers." subtitle="One pipeline behind every surface - no separate tools to babysit per channel." />
        <div style={threeColGridStyle}>
          {CHANNELS.map((c) => (
            <div key={c.title} className="channel-card" style={channelCardStyle}>
              <div style={iconBadgeStyle}>{c.icon}</div>
              <h3 style={cardTitleStyle}>{c.title}</h3>
              <p style={cardBodyStyle}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why agentic */}
      <section id="why-agentic" style={sectionStyle}>
        <SectionHeading eyebrow="WHY AGENTIC" title="Built to be trusted with your margin." subtitle="An agent that knows when to answer, and when to ask a human first." />
        <div style={featureGridStyle}>
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card" style={featureCardStyle}>
              <div style={featureIconStyle}>{f.icon}</div>
              <div>
                <h4 style={featureTitleStyle}>{f.title}</h4>
                <p style={featureBodyStyle}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live demo teaser */}
      <section style={sectionStyle}>
        <SectionHeading eyebrow="SEE IT WORK" title="Watch it answer a real request." subtitle="This is the same pipeline running live - not a mockup." />
        <div className="demo-visual" style={demoTeaserWrapStyle}>
          <div style={demoTeaserCardStyle}>
            <QuoteCard meta={DEMO_QUOTE} />
          </div>
          <a href="/demo" style={primaryBtnStyle}>
            Try it yourself <ArrowRightIcon size={16} />
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={statsSectionStyle}>
        <div style={statsGridStyle}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div className="stat-number" data-value={s.value} data-suffix={s.suffix} style={statNumberStyle}>
                0{s.suffix}
              </div>
              <div style={statLabelStyle}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ ...sectionStyle, textAlign: "center" }}>
        <div className="cta-fade">
          <h2 style={ctaHeadingStyle}>Stop losing RFQs to slower replies.</h2>
          <p style={{ ...heroSubStyle, margin: "0 auto 28px", textAlign: "center" }}>
            See the same agent that answers here quote a real request from your own catalog.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/demo" style={primaryBtnStyle}>
              Try the live demo <ArrowRightIcon size={16} />
            </a>
            <a href="mailto:noumanqureshi15@gmail.com" style={secondaryBtnStyle}>
              Get in touch
            </a>
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={navBrandStyle}>
          <Logo size={24} />
          Rfqly
        </div>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0 0" }}>
          Agentic RFQ automation for distributors &amp; wholesalers.
        </p>
      </footer>

      <ChatWidget
        title="Rfqly"
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
        messages={messages}
        onSend={send}
        isThinking={isThinking}
      />
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={trustBadgeStyle}>
      {icon} {label}
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 44px" }}>
      <div style={sectionEyebrowStyle}>{eyebrow}</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionSubtitleStyle}>{subtitle}</p>
    </div>
  );
}

const pageStyle: CSSProperties = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: "#0f172a",
  background: "#f8fafc",
  overflowX: "hidden",
};

const navStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 32px",
  background: "rgba(248,250,252,.85)",
  backdropFilter: "blur(8px)",
  borderBottom: "1px solid #e2e8f0",
};

const navBrandStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 };

const navLinksStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 24 };

const navLinkStyle: CSSProperties = { color: "#475569", fontSize: 13.5, fontWeight: 500, textDecoration: "none" };

const navCtaStyle: CSSProperties = {
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
  textDecoration: "none",
};

const heroSectionStyle: CSSProperties = { padding: "80px 32px 60px", maxWidth: 1180, margin: "0 auto" };

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: 56,
  alignItems: "center",
};

const eyebrowStyle: CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: "#0891b2", marginBottom: 16 };

const h1Style: CSSProperties = { fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 20px" };

const heroSubStyle: CSSProperties = { fontSize: 17, lineHeight: 1.6, color: "#475569", maxWidth: 520, margin: "0 0 28px" };

const heroCtasStyle: CSSProperties = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 };

const primaryBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  padding: "13px 24px",
  borderRadius: 10,
  fontSize: 14.5,
  fontWeight: 600,
  textDecoration: "none",
};

const secondaryBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  padding: "13px 24px",
  borderRadius: 10,
  fontSize: 14.5,
  fontWeight: 600,
  textDecoration: "none",
};

const trustRowStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };

const trustBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12.5,
  color: "#64748b",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 999,
  padding: "5px 12px",
};

const heroVisualWrapStyle: CSSProperties = { display: "flex", justifyContent: "center" };

const heroVisualCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(15, 23, 42, .12)",
  overflow: "hidden",
};

const heroVisualHeaderStyle: CSSProperties = {
  background: "linear-gradient(135deg, #0f172a, #164e63)",
  color: "#fff",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const buyerBubbleMini: CSSProperties = {
  alignSelf: "flex-end",
  background: "linear-gradient(135deg, #0891b2, #0e7490)",
  color: "#fff",
  padding: "9px 13px",
  borderRadius: 12,
  borderBottomRightRadius: 4,
  fontSize: 13,
  maxWidth: "85%",
  marginLeft: "auto",
};

const sectionStyle: CSSProperties = { padding: "72px 32px", maxWidth: 1180, margin: "0 auto" };

const sectionEyebrowStyle: CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: "#0891b2", marginBottom: 12 };

const sectionTitleStyle: CSSProperties = { fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em", margin: "0 0 12px" };

const sectionSubtitleStyle: CSSProperties = { fontSize: 15.5, color: "#64748b", lineHeight: 1.6, margin: 0 };

const threeColGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 };

const archGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 48, alignItems: "center" };

const archListStyle: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 };

const archListItemStyle: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, color: "#334155", lineHeight: 1.5 };

const archBulletStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  marginTop: 6,
  flexShrink: 0,
};

const painCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
};

const channelCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
};

const iconBadgeStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
};

const cardTitleStyle: CSSProperties = { fontSize: 17, fontWeight: 700, margin: "0 0 8px" };

const cardBodyStyle: CSSProperties = { fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 };

const stepsWrapStyle: CSSProperties = { position: "relative", maxWidth: 640, margin: "0 auto", paddingLeft: 40 };

const lineTrackStyle: CSSProperties = {
  position: "absolute",
  left: 19,
  top: 8,
  bottom: 8,
  width: 2,
  background: "#e2e8f0",
  borderRadius: 2,
};

const lineFillStyle: CSSProperties = {
  width: "100%",
  height: 0,
  background: "linear-gradient(180deg, #0891b2, #0f172a)",
  borderRadius: 2,
};

const stepRowStyle: CSSProperties = { display: "flex", gap: 20, marginBottom: 40, position: "relative" };

const stepIconStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#fff",
  border: "2px solid #0891b2",
  color: "#0891b2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginLeft: -40,
  zIndex: 1,
};

const stepNumberStyle: CSSProperties = { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".05em", marginBottom: 4 };

const featureGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 };

const featureCardStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 20,
};

const featureIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 9,
  background: "#ecfeff",
  color: "#0e7490",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const featureTitleStyle: CSSProperties = { fontSize: 14.5, fontWeight: 700, margin: "0 0 4px" };

const featureBodyStyle: CSSProperties = { fontSize: 13.5, color: "#64748b", lineHeight: 1.5, margin: 0 };

const demoTeaserWrapStyle: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 24 };

const demoTeaserCardStyle: CSSProperties = { width: "100%", maxWidth: 420 };

const statsSectionStyle: CSSProperties = {
  padding: "60px 32px",
  background: "linear-gradient(135deg, #0f172a, #164e63)",
  color: "#fff",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 24,
  maxWidth: 900,
  margin: "0 auto",
};

const statNumberStyle: CSSProperties = { fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em" };

const statLabelStyle: CSSProperties = { fontSize: 13.5, color: "#cbd5e1", marginTop: 6 };

const ctaHeadingStyle: CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em", margin: "0 0 12px" };

const footerStyle: CSSProperties = {
  textAlign: "center",
  padding: "36px 32px 48px",
  borderTop: "1px solid #e2e8f0",
};
