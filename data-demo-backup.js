window.AULA_DATA = {
  "users": [
    {
      "id": "u-admin",
      "name": "Facundo Andrade",
      "email": "admin@cordobacasting.com",
      "password": "demo123",
      "role": "admin",
      "courses": [
        "c1",
        "c2",
        "c3",
        "c4",
        "c5"
      ]
    },
    {
      "id": "u-teacher",
      "name": "Maite Selser",
      "email": "profe@cordobacasting.com",
      "password": "demo123",
      "role": "teacher",
      "courses": [
        "c2",
        "c5"
      ]
    },
    {
      "id": "u-student",
      "name": "Sofía Demo",
      "email": "alumna@cordobacasting.com",
      "password": "demo123",
      "role": "student",
      "courses": [
        "c1",
        "c3"
      ]
    }
  ],
  "courses": [
    {
      "id": "c1",
      "name": "Actuación frente a cámara",
      "code": "NIVEL 1",
      "teacher": "Facundo Andrade",
      "description": "Lenguaje audiovisual, actuación para cámara y herramientas fundamentales.",
      "color": "#8b5d45",
      "progress": 45
    },
    {
      "id": "c2",
      "name": "Actuación para jóvenes",
      "code": "NIVEL 2",
      "teacher": "Maite Selser",
      "description": "Aplicación de técnicas actorales al audiovisual para jóvenes.",
      "color": "#516c77",
      "progress": 20
    },
    {
      "id": "c3",
      "name": "Dirección actoral",
      "code": "DIRECCIÓN",
      "teacher": "Facundo Andrade",
      "description": "Herramientas para dirigir intérpretes frente a cámara.",
      "color": "#5d527d",
      "progress": 10
    },
    {
      "id": "c4",
      "name": "Taller de escenas",
      "code": "TALLER",
      "teacher": "Córdoba Casting",
      "description": "Entrenamiento práctico y grabación de escenas para reel.",
      "color": "#4e715b",
      "progress": 0
    },
    {
      "id": "c5",
      "name": "Actuación frente a cámara",
      "code": "NIVEL 2",
      "teacher": "Maite Selser",
      "description": "Meisner, Stanislavski, Adler y escenas de mayor complejidad.",
      "color": "#984e58",
      "progress": 50
    }
  ],
  "modules": {
    "c1": [
      {
        "id": "m11",
        "title": "Lenguaje audiovisual",
        "lessons": [
          {
            "id": "l111",
            "title": "Introducción al trabajo frente a cámara",
            "type": "video",
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "description": "Conceptos iniciales del lenguaje audiovisual."
          },
          {
            "id": "l112",
            "title": "Planos y continuidad",
            "type": "drive",
            "url": "https://drive.google.com/",
            "description": "Material complementario de lectura."
          }
        ]
      },
      {
        "id": "m12",
        "title": "Acción y reacción",
        "lessons": [
          {
            "id": "l121",
            "title": "Microgestos y escucha",
            "type": "video",
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "description": "Ejercicio práctico y análisis."
          }
        ]
      }
    ],
    "c2": [
      {
        "id": "m21",
        "title": "Repaso y adaptación a cámara",
        "lessons": [
          {
            "id": "l211",
            "title": "Del escenario al audiovisual",
            "type": "video",
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "description": "Diferencias principales de escala y actuación."
          }
        ]
      }
    ],
    "c3": [
      {
        "id": "m31",
        "title": "El trabajo con el actor",
        "lessons": [
          {
            "id": "l311",
            "title": "Objetivo, acción y dirección",
            "type": "video",
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "description": "Bases para dar indicaciones accionables."
          },
          {
            "id": "l312",
            "title": "Guía de ejercicios",
            "type": "drive",
            "url": "https://drive.google.com/",
            "description": "Documento de apoyo para clase."
          }
        ]
      }
    ],
    "c4": [],
    "c5": [
      {
        "id": "m51",
        "title": "Meisner",
        "lessons": [
          {
            "id": "l511",
            "title": "Repetición y escucha",
            "type": "video",
            "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "description": "Introducción al trabajo de repetición."
          }
        ]
      },
      {
        "id": "m52",
        "title": "Stanislavski",
        "lessons": [
          {
            "id": "l521",
            "title": "Circunstancias y objeto",
            "type": "drive",
            "url": "https://drive.google.com/",
            "description": "Apuntes y ejercicio práctico."
          }
        ]
      }
    ]
  }
};
