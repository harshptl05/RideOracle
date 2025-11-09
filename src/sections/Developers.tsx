"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Code, Zap, Users } from "lucide-react";

const developers = [
  {
    name: "Alex Chen",
    role: "Full Stack Developer",
    bio: "Passionate about building seamless user experiences with modern web technologies.",
    image: "👨‍💻",
    skills: ["React", "TypeScript", "Node.js", "Next.js"],
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "alex@ryota.com",
  },
  {
    name: "Sarah Johnson",
    role: "AI/ML Engineer",
    bio: "Specializing in conversational AI and machine learning to enhance car discovery experiences.",
    image: "👩‍💻",
    skills: ["Python", "TensorFlow", "OpenAI", "NLP"],
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "sarah@ryota.com",
  },
  {
    name: "Michael Rodriguez",
    role: "UI/UX Designer",
    bio: "Creating beautiful, intuitive interfaces that make car shopping enjoyable and effortless.",
    image: "👨‍🎨",
    skills: ["Figma", "Framer Motion", "Design Systems", "Prototyping"],
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "michael@ryota.com",
  },
  {
    name: "Emily Zhang",
    role: "Backend Developer",
    bio: "Building robust APIs and data systems to power the next generation of car finder platforms.",
    image: "👩‍🔧",
    skills: ["Python", "PostgreSQL", "Redis", "Docker"],
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "emily@ryota.com",
  },
];

export const Developers = () => {
  return (
    <section id="developers" className="py-20 md:py-32 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-4 bg-gradient-to-r from-white via-gray-200 to-white text-transparent bg-clip-text">
            Meet Our Team
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            The talented developers and designers behind Ryota, building the future of car discovery.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev, index) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="text-6xl mb-4 text-center">{dev.image}</div>
              <h3 className="text-xl font-semibold text-white mb-1 text-center">{dev.name}</h3>
              <p className="text-sm text-white/60 mb-4 text-center">{dev.role}</p>
              <p className="text-sm text-white/70 mb-4 text-center min-h-[3rem]">{dev.bio}</p>
              
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {dev.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-md border border-white/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex justify-center gap-3 pt-4 border-t border-white/10">
                <a
                  href={dev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Github className="w-4 h-4 text-white/70" />
                </a>
                <a
                  href={dev.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-white/70" />
                </a>
                <a
                  href={`mailto:${dev.email}`}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Mail className="w-4 h-4 text-white/70" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full">
            <Users className="w-5 h-5 text-white/70" />
            <span className="text-white/70 text-sm">Join our team and help shape the future of car discovery</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};


