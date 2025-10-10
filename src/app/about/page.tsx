import React from "react";
import { Users, Target, Newspaper, Mail, Instagram, Twitter } from "lucide-react";

const About = () => {
  return (
    <section className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen py-16 px-6 md:px-16">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-400">
            About Us
          </h1>
          <p className="text-lg text-gray-300">
            Celebrating Indian sports, one story at a time.
          </p>
        </header>

        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="text-indigo-400" size={24} /> Who We Are
          </h2>
          <p className="text-gray-300 leading-relaxed">
            We are a passionate team of sports enthusiasts, analysts, and
            storytellers dedicated to showcasing the best of{" "}
            <strong>Indian Sports</strong>. From national championships to
            emerging talent at the grassroots level, we bring you accurate,
            inspiring, and data-driven coverage across multiple disciplines.
          </p>
        </section>

        {/* Mission */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="text-indigo-400" size={24} /> Our Mission
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Our mission is simple — to celebrate every Indian athlete’s journey,
            inspire upcoming talent, and make verified sports reporting more
            accessible. We believe every athlete, from a local champion to a
            world record holder, deserves recognition.
          </p>
        </section>

        {/* Coverage */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Newspaper className="text-indigo-400" size={24} /> What We Cover
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Comprehensive results from national and international events</li>
            <li>Exclusive athlete interviews and performance breakdowns</li>
            <li>In-depth blogs, analytics, and commentary</li>
            <li>Coverage across sports — boxing, cricket, athletics, wrestling, and more</li>
          </ul>
        </section>

        {/* Vision / Future */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            🌍 Our Vision
          </h2>
          <p className="text-gray-300 leading-relaxed">
            We envision a future where Indian sports get global recognition and
            fans have a single reliable destination for results, insights, and
            inspiring stories. We’re here to build that platform — one event at
            a time.
          </p>
        </section>

        {/* Contact CTA */}
        <section className="text-center mt-12">
          <h3 className="text-xl font-semibold text-indigo-400 mb-3">
            Let’s Connect
          </h3>
          <p className="text-gray-300 mb-6">
            Have a story to share, a collaboration idea, or just want to talk
            sports? Reach out to us anytime!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="mailto:indiaatsports31@gmail.com"
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-full transition"
            >
              <Mail size={20} /> E-Mail
            </a>
            <a
              href="https://instagram.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white px-5 py-3 rounded-full transition"
            >
              <Instagram size={20} /> Instagram
            </a>
            <a
              href="https://twitter.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white px-5 py-3 rounded-full transition"
            >
              <Twitter size={20} /> Twitter (X)
            </a>
          </div>
        </section>
      </div>
    </section>
  );
};

export default About;
