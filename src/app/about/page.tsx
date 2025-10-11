
import React from "react";
import { Users, Target, Newspaper, Mail, Instagram, Twitter } from "lucide-react";

const About = () => {
  return (
    <section style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", gap: "2.5rem", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{ textAlign: "center", gap: "1rem", display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)" }}>
            About Sports Pulse
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            We are a passionate team of sports enthusiasts, analysts, and storytellers dedicated to showcasing the best of <strong>Indian Sports</strong>. From national championships to emerging talent at the grassroots level, we bring you accurate, inspiring, and data-driven coverage across multiple disciplines.
          </p>
        </header>

        {/* Introduction */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users style={{ color: "var(--accent)" }} size={24} /> Who We Are
          </h2>
          <p style={{ color: "var(--muted-2)", lineHeight: 1.7 }}>
            We are a passionate team of sports enthusiasts, analysts, and
            storytellers dedicated to showcasing the best of <strong>Indian Sports</strong>. From national championships to
            emerging talent at the grassroots level, we bring you accurate,
            inspiring, and data-driven coverage across multiple disciplines.
          </p>
        </section>

        {/* Mission */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target style={{ color: "var(--accent)" }} size={24} /> Our Mission
          </h2>
          <p style={{ color: "var(--muted-2)", lineHeight: 1.7 }}>
            Our mission is simple — to celebrate every Indian athlete’s journey,
            inspire upcoming talent, and make verified sports reporting more
            accessible. We believe every athlete, from a local champion to a
            world record holder, deserves recognition.
          </p>
        </section>

        {/* Coverage */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Newspaper style={{ color: "var(--accent)" }} size={24} /> What We Cover
          </h2>
          <ul style={{ color: "var(--muted)", paddingLeft: "1.25rem", lineHeight: 1.7 }}>
            <li style={{ color: "var(--muted)" }}>Comprehensive results from national and international events</li>
            <li>Exclusive athlete interviews and performance breakdowns</li>
            <li>In-depth blogs, analytics, and commentary</li>
            <li>Coverage across sports — boxing, cricket, athletics, wrestling, and more</li>
          </ul>
        </section>

        {/* Vision / Future */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🌍 Our Vision
          </h2>
          <p style={{ color: "var(--muted-2)", lineHeight: 1.7 }}>
            We envision a future where Indian sports get global recognition and
            fans have a single reliable destination for results, insights, and
            inspiring stories. We’re here to build that platform — one event at
            a time.
          </p>
        </section>

        {/* Contact CTA */}
        <section style={{ textAlign: "center", marginTop: "3rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--accent)" }}>
            Let’s Connect
          </h3>
          <p style={{ color: "var(--muted-2)", marginBottom: "1.5rem" }}>
            Have a story to share, a collaboration idea, or just want to talk
            sports? Reach out to us anytime!
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <a href="mailto:indiaatsports31@gmail.com" className="about-social-link" style={{ background: "var(--surface)", color: "var(--primary)" }}>
              <Mail size={20} /> Email
            </a>
            <a href="https://instagram.com/indian_sports_pulse" target="_blank" rel="noopener noreferrer" className="about-social-link" style={{ background: "var(--surface)", color: "var(--primary)" }}>
              <Instagram size={20} /> Instagram
            </a>
            <a href="https://twitter.com/indian_sports_pulse" target="_blank" rel="noopener noreferrer" className="about-social-link" style={{ background: "var(--surface)", color: "var(--primary)" }}>
              <Twitter size={20} /> Twitter
            </a>
          </div>
        </section>
      </div>
    </section>
  );
};

export default About;
