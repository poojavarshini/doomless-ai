"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoVideo } from "@/lib/demo-videos";

interface AnimatedReelCanvasProps {
  topic: DemoVideo["topic"];
  index: number;
  playing: boolean;
}

const palettes: Record<DemoVideo["topic"], [string, string, string]> = {
  Entertainment: ["#3b082f", "#db2777", "#fb923c"],
  Learning: ["#082f49", "#0891b2", "#60a5fa"],
  Productivity: ["#052e2b", "#0f766e", "#84cc16"],
  News: ["#0f172a", "#3730a3", "#38bdf8"],
  "Scroll bait": ["#2e1065", "#b91c1c", "#f59e0b"],
};

export function AnimatedReelCanvas({ topic, index, playing }: AnimatedReelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nearViewport, setNearViewport] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const width = 270;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    let animationFrame = 0;
    let previousFrame = 0;
    const startedAt = performance.now();

    const render = (now: number) => {
      if (now - previousFrame < 1000 / 15) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      previousFrame = now;
      const time = ((now - startedAt) / 1000) % 10;
      drawFrame(context, width, height, topic, index, time);

      if (playing && nearViewport) animationFrame = requestAnimationFrame(render);
    };

    drawFrame(context, width, height, topic, index, 0);
    if (playing && nearViewport) animationFrame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrame);
  }, [index, nearViewport, playing, topic]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full"
      aria-hidden="true"
    />
  );
}

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  topic: DemoVideo["topic"],
  index: number,
  time: number,
) {
  const palette = palettes[topic];
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.55, palette[1]);
  gradient.addColorStop(1, palette[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  drawMovingLights(context, width, height, palette, time, index);

  if (topic === "Entertainment") drawDanceScene(context, width, time, index);
  if (topic === "Learning") drawLearningScene(context, width, time);
  if (topic === "Productivity") drawProductivityScene(context, width, time);
  if (topic === "News") drawNewsScene(context, width, time);
  if (topic === "Scroll bait") drawScrollBaitScene(context, width, time);
}

function drawMovingLights(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: [string, string, string],
  time: number,
  index: number,
) {
  for (let light = 0; light < 7; light += 1) {
    const phase = light * 1.7 + index;
    const x = (Math.sin(time * 0.65 + phase) * 0.5 + 0.5) * width;
    const y = (Math.cos(time * 0.5 + phase) * 0.5 + 0.5) * height;
    const radius = 24 + ((light * 13) % 38);
    context.globalAlpha = 0.12;
    context.fillStyle = light % 2 ? "#ffffff" : palette[2];
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawDanceScene(context: CanvasRenderingContext2D, width: number, time: number, index: number) {
  const centerX = width / 2;
  const beat = Math.sin(time * 5 + index);
  const bounce = Math.abs(Math.sin(time * 4)) * 12;
  const bodyY = 190 - bounce;

  context.strokeStyle = "rgba(255,255,255,0.95)";
  context.fillStyle = "rgba(255,255,255,0.95)";
  context.lineWidth = 9;
  context.lineCap = "round";
  context.beginPath();
  context.arc(centerX, bodyY - 62, 24, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(centerX, bodyY - 30);
  context.lineTo(centerX, bodyY + 52);
  context.moveTo(centerX, bodyY - 6);
  context.lineTo(centerX - 62, bodyY + beat * 30);
  context.moveTo(centerX, bodyY - 6);
  context.lineTo(centerX + 62, bodyY - beat * 30);
  context.moveTo(centerX, bodyY + 50);
  context.lineTo(centerX - 45, bodyY + 108 + beat * 12);
  context.moveTo(centerX, bodyY + 50);
  context.lineTo(centerX + 45, bodyY + 108 - beat * 12);
  context.stroke();

  context.font = "bold 26px Arial";
  context.fillText("♪", 42 + Math.sin(time * 2) * 18, 120 - ((time * 22) % 80));
  context.fillText("♫", 208 + Math.cos(time * 2) * 14, 165 - ((time * 18) % 90));
}

function drawLearningScene(context: CanvasRenderingContext2D, width: number, time: number) {
  const cardOffset = Math.sin(time * 1.8) * 12;
  for (let card = 2; card >= 0; card -= 1) {
    const y = 105 + card * 34 + cardOffset * (card / 3);
    context.fillStyle = `rgba(255,255,255,${0.25 + card * 0.18})`;
    roundedRect(context, 40 + card * 6, y, width - 80 - card * 12, 130, 18);
    context.fill();
  }
  context.fillStyle = "#ffffff";
  context.font = "bold 46px Arial";
  context.fillText("A+", 103, 180 + cardOffset);
  context.fillStyle = "rgba(255,255,255,0.8)";
  context.fillRect(72, 210 + cardOffset, 126, 8);
  context.fillRect(92, 230 + cardOffset, 86, 8);
}

function drawProductivityScene(context: CanvasRenderingContext2D, width: number, time: number) {
  const completed = Math.floor(time / 1.4) % 4;
  context.fillStyle = "rgba(255,255,255,0.18)";
  roundedRect(context, 34, 80, width - 68, 230, 24);
  context.fill();

  for (let item = 0; item < 4; item += 1) {
    const y = 115 + item * 48;
    context.strokeStyle = "rgba(255,255,255,0.9)";
    context.lineWidth = 3;
    context.strokeRect(58, y, 22, 22);
    context.fillStyle = "rgba(255,255,255,0.55)";
    context.fillRect(96, y + 7, 108 - item * 9, 8);
    if (item <= completed) {
      context.strokeStyle = "#d9f99d";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(61, y + 11);
      context.lineTo(69, y + 19);
      context.lineTo(84, y - 3);
      context.stroke();
    }
  }
}

function drawNewsScene(context: CanvasRenderingContext2D, width: number, time: number) {
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.font = "bold 54px Arial";
  context.fillText("60", 98, 155);
  context.font = "bold 18px Arial";
  context.fillText("SECOND BRIEF", 67, 187);

  const tickerX = width - ((time * 75) % (width + 250));
  context.fillStyle = "rgba(2,6,23,0.72)";
  context.fillRect(0, 245, width, 48);
  context.fillStyle = "#ffffff";
  context.font = "bold 14px Arial";
  context.fillText("CONTEXT  •  FACTS  •  WHAT CHANGED", tickerX, 275);
}

function drawScrollBaitScene(context: CanvasRenderingContext2D, width: number, time: number) {
  const number = 5 - (Math.floor(time * 1.5) % 5);
  const pulse = 1 + Math.abs(Math.sin(time * 6)) * 0.18;
  context.save();
  context.translate(width / 2, 175);
  context.scale(pulse, pulse);
  context.fillStyle = "rgba(255,255,255,0.16)";
  context.beginPath();
  context.arc(0, 0, 86, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "bold 100px Arial";
  context.textAlign = "center";
  context.fillText(String(number), 0, 34);
  context.restore();
  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = "bold 17px Arial";
  context.fillText("WAIT FOR THE REVEAL...", 34, 300);

  for (let spark = 0; spark < 12; spark += 1) {
    const x = (spark * 31 + time * 85) % width;
    const y = 50 + ((spark * 47 + time * 55) % 280);
    context.fillStyle = spark % 2 ? "#fde68a" : "#ffffff";
    context.fillRect(x, y, 5, 16);
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
