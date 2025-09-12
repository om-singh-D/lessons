import { NextResponse } from 'next/server';
import GeminiAPIManager from '@/lib/geminiManager';

// Initialize Gemini API Manager
const geminiManager = new GeminiAPIManager();

// Predefined lesson templates for different subjects and grade levels
const lessonTemplates = {
  mathematics: {
    elementary: {
      title: "Elementary Mathematics Lesson",
      duration: 45,
      activities: [
        {
          type: "exercise",
          title: "Warm-up Practice",
          description: "Review previous concepts",
          duration: 10,
          content: "Quick mental math exercises or problem review",
          materials: ["Whiteboard", "Worksheets"],
          instructions: "Start with simple problems to activate prior knowledge"
        },
        {
          type: "discussion",
          title: "Concept Introduction",
          description: "Introduce new mathematical concept",
          duration: 15,
          content: "Use visual aids and manipulatives to explain new concept",
          materials: ["Visual aids", "Manipulatives", "Interactive whiteboard"],
          instructions: "Use concrete examples and real-world applications"
        },
        {
          type: "practice",
          title: "Guided Practice",
          description: "Practice new concept with teacher guidance",
          duration: 15,
          content: "Work through problems together as a class",
          materials: ["Practice worksheets", "Calculators if needed"],
          instructions: "Gradually release responsibility to students"
        },
        {
          type: "exercise",
          title: "Independent Practice",
          description: "Students work independently",
          duration: 5,
          content: "Individual problem solving",
          materials: ["Individual worksheets"],
          instructions: "Circulate and provide individual support"
        }
      ],
      assessment: {
        formativeAssessment: [
          {
            type: "observation",
            description: "Observe student participation and understanding during activities",
            criteria: ["Participation", "Accuracy", "Problem-solving approach"]
          }
        ]
      }
    },
    middle: {
      title: "Middle School Mathematics Lesson",
      duration: 50,
      activities: [
        {
          type: "quiz",
          title: "Entry Ticket",
          description: "Quick assessment of prerequisite knowledge",
          duration: 5,
          content: "3-5 questions on previous learning",
          materials: ["Entry ticket sheets"],
          instructions: "Use results to adjust lesson pacing"
        },
        {
          type: "discussion",
          title: "Problem Exploration",
          description: "Explore mathematical problem or concept",
          duration: 20,
          content: "Present challenging problem for investigation",
          materials: ["Problem sets", "Graphing tools"],
          instructions: "Encourage multiple solution strategies"
        },
        {
          type: "project",
          title: "Collaborative Investigation",
          description: "Work in groups to solve complex problems",
          duration: 20,
          content: "Group problem-solving with presentation",
          materials: ["Group worksheets", "Presentation materials"],
          instructions: "Rotate between groups to facilitate"
        },
        {
          type: "discussion",
          title: "Synthesis and Reflection",
          description: "Share solutions and reflect on learning",
          duration: 5,
          content: "Group presentations and class discussion",
          materials: ["Presentation space"],
          instructions: "Focus on mathematical reasoning and connections"
        }
      ]
    },
    high: {
      title: "High School Mathematics Lesson",
      duration: 55,
      activities: [
        {
          type: "discussion",
          title: "Concept Connection",
          description: "Connect new learning to previous concepts",
          duration: 10,
          content: "Review and make connections to prior learning",
          materials: ["Concept maps", "Technology tools"],
          instructions: "Highlight mathematical relationships"
        },
        {
          type: "project",
          title: "Investigation and Discovery",
          description: "Investigate mathematical relationships",
          duration: 25,
          content: "Use technology to explore mathematical patterns",
          materials: ["Graphing calculators", "Computer software"],
          instructions: "Guide students to discover principles"
        },
        {
          type: "exercise",
          title: "Application and Problem Solving",
          description: "Apply concepts to real-world problems",
          duration: 15,
          content: "Work on complex, multi-step problems",
          materials: ["Real-world problem sets"],
          instructions: "Encourage mathematical modeling"
        },
        {
          type: "discussion",
          title: "Mathematical Communication",
          description: "Explain reasoning and justify solutions",
          duration: 5,
          content: "Present solutions with mathematical justification",
          materials: ["Presentation tools"],
          instructions: "Focus on mathematical communication skills"
        }
      ]
    }
  },
  science: {
    elementary: {
      title: "Elementary Science Lesson",
      duration: 45,
      activities: [
        {
          type: "discussion",
          title: "Question and Wonder",
          description: "Engage curiosity about scientific phenomena",
          duration: 10,
          content: "Present phenomenon and generate questions",
          materials: ["Phenomenon examples", "Question chart"],
          instructions: "Encourage scientific questioning"
        },
        {
          type: "exercise",
          title: "Hands-on Investigation",
          description: "Conduct simple scientific investigation",
          duration: 25,
          content: "Guided experiment or observation",
          materials: ["Investigation materials", "Recording sheets"],
          instructions: "Emphasize observation and data collection"
        },
        {
          type: "discussion",
          title: "Share and Discuss",
          description: "Share findings and make connections",
          duration: 10,
          content: "Discuss observations and draw conclusions",
          materials: ["Chart paper", "Markers"],
          instructions: "Connect to scientific concepts"
        }
      ]
    }
  },
  language_arts: {
    elementary: {
      title: "Elementary Language Arts Lesson",
      duration: 60,
      activities: [
        {
          type: "reading",
          title: "Read Aloud",
          description: "Teacher reads engaging text",
          duration: 15,
          content: "Interactive read aloud with discussion",
          materials: ["Selected text", "Discussion questions"],
          instructions: "Model fluent reading and thinking aloud"
        },
        {
          type: "discussion",
          title: "Text Discussion",
          description: "Discuss text meaning and connections",
          duration: 15,
          content: "Guided discussion about text",
          materials: ["Text", "Discussion prompts"],
          instructions: "Encourage text-to-self, text-to-text connections"
        },
        {
          type: "exercise",
          title: "Skill Practice",
          description: "Practice specific literacy skill",
          duration: 20,
          content: "Focused skill instruction and practice",
          materials: ["Skill worksheets", "Manipulatives"],
          instructions: "Provide differentiated practice opportunities"
        },
        {
          type: "exercise",
          title: "Independent Reading",
          description: "Students read independently",
          duration: 10,
          content: "Silent reading with reading response",
          materials: ["Independent reading books", "Reading journals"],
          instructions: "Conference with individual students"
        }
      ]
    }
  }
};

// Helper function to generate AI-powered lesson suggestions
async function generateLessonSuggestions(subject, gradeLevel, topic) {
  const prompt = `
Generate creative lesson activity suggestions for:
Subject: ${subject}
Grade Level: ${gradeLevel}
Topic: ${topic}

Provide 5-7 diverse activity suggestions with the following format for each:
{
  "type": "activity type (reading/exercise/video/discussion/project/quiz/practice)",
  "title": "Engaging activity title",
  "description": "Brief activity description",
  "duration": "estimated duration in minutes",
  "content": "Detailed activity content and procedures",
  "materials": ["material1", "material2"],
  "instructions": "Step-by-step teacher instructions"
}

Make activities age-appropriate, engaging, and aligned with best practices for ${subject} education.
Include a variety of activity types to cater to different learning styles.
`;

  try {
    const response = await geminiManager.generateContent(prompt);
    
    // Extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // If no array found, look for individual activity objects
      const activityMatches = response.match(/\{[\s\S]*?\}/g);
      if (activityMatches) {
        return activityMatches.map(match => JSON.parse(match));
      }
    }
    
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('Error generating lesson suggestions:', error);
    return null;
  }
}

// GET /api/lessons/templates - Get lesson templates and suggestions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject')?.toLowerCase();
    const gradeLevel = searchParams.get('gradeLevel')?.toLowerCase();
    const topic = searchParams.get('topic');
    const useAI = searchParams.get('useAI') === 'true';
    
    let response = {
      success: true,
      templates: {},
      suggestions: null
    };
    
    // Get predefined templates
    if (subject && gradeLevel) {
      const subjectTemplates = lessonTemplates[subject];
      if (subjectTemplates) {
        const levelTemplate = subjectTemplates[gradeLevel];
        if (levelTemplate) {
          response.templates = {
            [subject]: {
              [gradeLevel]: levelTemplate
            }
          };
        }
      }
      
      // Generate AI suggestions if requested and topic provided
      if (useAI && topic) {
        const aiSuggestions = await generateLessonSuggestions(subject, gradeLevel, topic);
        if (aiSuggestions) {
          response.suggestions = {
            topic,
            activities: aiSuggestions,
            generatedAt: new Date().toISOString()
          };
        }
      }
    } else {
      // Return all templates if no specific subject/grade requested
      response.templates = lessonTemplates;
    }
    
    // Add grade level mapping
    response.gradeLevels = {
      elementary: ['K', '1', '2', '3', '4', '5'],
      middle: ['6', '7', '8'],
      high: ['9', '10', '11', '12']
    };
    
    // Add subject list
    response.subjects = [
      'mathematics',
      'science',
      'language_arts',
      'social_studies',
      'art',
      'music',
      'physical_education',
      'technology',
      'foreign_language'
    ];
    
    // Add activity types
    response.activityTypes = [
      'reading',
      'exercise',
      'video',
      'discussion',
      'project',
      'quiz',
      'practice'
    ];
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching lesson templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson templates' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/templates - Generate custom template based on criteria
export async function POST(request) {
  try {
    const body = await request.json();
    const { subject, gradeLevel, topic, duration, focusAreas, learningObjectives } = body;
    
    if (!subject || !gradeLevel || !topic) {
      return NextResponse.json(
        { success: false, error: 'Subject, grade level, and topic are required' },
        { status: 400 }
      );
    }
    
    const prompt = `
Create a detailed lesson plan template for:
Subject: ${subject}
Grade Level: ${gradeLevel}
Topic: ${topic}
Duration: ${duration || 45} minutes
Focus Areas: ${focusAreas ? focusAreas.join(', ') : 'General'}
Learning Objectives: ${learningObjectives ? learningObjectives.join(', ') : 'To be determined'}

Provide a comprehensive lesson template in JSON format with the following structure:
{
  "title": "Lesson title",
  "overview": "Brief lesson overview",
  "objectives": ["objective1", "objective2"],
  "materials": ["material1", "material2"],
  "vocabulary": ["term1", "term2"],
  "lessonStructure": {
    "opening": {
      "duration": "minutes",
      "activities": ["activity1", "activity2"],
      "purpose": "engagement and activation"
    },
    "main": {
      "duration": "minutes", 
      "activities": ["activity1", "activity2"],
      "purpose": "instruction and practice"
    },
    "closing": {
      "duration": "minutes",
      "activities": ["activity1", "activity2"], 
      "purpose": "synthesis and reflection"
    }
  },
  "activities": [
    {
      "type": "activity type",
      "title": "Activity title",
      "description": "Description",
      "duration": "minutes",
      "content": "Detailed content",
      "materials": ["materials"],
      "instructions": "Teacher instructions"
    }
  ],
  "differentiation": {
    "modifications": ["modification1", "modification2"],
    "extensions": ["extension1", "extension2"],
    "supports": ["support1", "support2"]
  },
  "assessment": {
    "formative": ["method1", "method2"],
    "summative": ["method1", "method2"],
    "criteria": ["criteria1", "criteria2"]
  },
  "homework": ["assignment1", "assignment2"],
  "extensions": ["extension1", "extension2"],
  "reflection": ["question1", "question2"]
}

Make sure the template is age-appropriate and follows best practices for ${subject} education at the ${gradeLevel} level.
`;

    const aiResponse = await geminiManager.generateContent(prompt);
    
    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const customTemplate = JSON.parse(jsonMatch[0]);
      
      return NextResponse.json({
        success: true,
        template: customTemplate,
        metadata: {
          subject,
          gradeLevel,
          topic,
          generatedAt: new Date().toISOString(),
          duration: duration || 45
        }
      });
    } else {
      throw new Error('Could not parse AI response');
    }
    
  } catch (error) {
    console.error('Error generating custom template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate custom template' },
      { status: 500 }
    );
  }
}
