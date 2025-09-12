# Lesson Creator API Documentation

## Overview

The Lesson Creator API provides comprehensive backend functionality for creating, managing, and exporting educational lesson plans. It integrates with Gemini AI for intelligent lesson generation and supports multiple export formats.

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

All endpoints are prefixed with `/api/lessons`

## Endpoints

### 1. Get User Lessons

**GET** `/api/lessons`

Retrieve all lessons for the authenticated user with optional filtering.

**Query Parameters:**
- `topic` (string, optional): Filter by lesson topic
- `gradeLevel` (string, optional): Filter by grade level
- `subject` (string, optional): Filter by subject
- `difficulty` (string, optional): Filter by difficulty (beginner/intermediate/advanced)
- `tags` (string, optional): Comma-separated list of tags
- `limit` (number, optional): Number of lessons per page (default: 20)
- `page` (number, optional): Page number (default: 1)
- `lessonId` (string, optional): Get specific lesson by ID

**Response:**
```json
{
  "success": true,
  "lessons": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  },
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email@example.com",
    "totalLessons": 50
  }
}
```

### 2. Create New Lesson

**POST** `/api/lessons`

Create a new lesson plan with AI assistance or custom data.

**Request Body:**
```json
{
  "topic": "Algebra Basics",
  "gradeLevel": "8",
  "subject": "Mathematics",
  "teachingObjectives": [
    "Students will understand linear equations",
    "Students will solve basic algebraic problems"
  ],
  "useAI": true,
  "customLessonData": {
    // Optional: custom lesson structure
    "title": "Custom Title",
    "duration": 45,
    // ... other lesson fields
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "lesson": {
    "_id": "lesson_id",
    "title": "Algebra Basics - Grade 8",
    "topic": "Algebra Basics",
    // ... complete lesson object
  },
  "lessonId": "lesson_id"
}
```

### 3. Update Lesson

**PUT** `/api/lessons`

Update an existing lesson.

**Request Body:**
```json
{
  "lessonId": "lesson_id",
  "updateData": {
    "title": "Updated Title",
    "duration": 60,
    // ... any lesson fields to update
  }
}
```

### 4. Delete Lesson

**DELETE** `/api/lessons?lessonId=lesson_id`

Delete a specific lesson.

### 5. Export Lesson

**POST** `/api/lessons/export`

Export a lesson in various formats.

**Request Body:**
```json
{
  "lessonId": "lesson_id",
  "format": "pdf" // pdf, google-docs, lms, json
}
```

**Response:** File download with appropriate format.

### 6. Get Lesson Templates

**GET** `/api/lessons/templates`

Get predefined lesson templates and AI-generated suggestions.

**Query Parameters:**
- `subject` (string, optional): Filter by subject
- `gradeLevel` (string, optional): Filter by grade level  
- `topic` (string, optional): Topic for AI suggestions
- `useAI` (boolean, optional): Generate AI suggestions

### 7. Generate Custom Template

**POST** `/api/lessons/templates`

Generate a custom lesson template using AI.

**Request Body:**
```json
{
  "subject": "Science",
  "gradeLevel": "5",
  "topic": "Solar System",
  "duration": 45,
  "focusAreas": ["observation", "research"],
  "learningObjectives": ["Identify planets", "Understand orbits"]
}
```

## Lesson Structure

### Complete Lesson Object

```json
{
  "_id": "lesson_id",
  "title": "Lesson Title",
  "topic": "Topic Name",
  "gradeLevel": "8",
  "subject": "Mathematics",
  "duration": 45,
  "teachingObjectives": [
    "Objective 1",
    "Objective 2"
  ],
  "keyConcepts": [
    {
      "concept": "Concept Name",
      "explanation": "Detailed explanation",
      "examples": ["Example 1", "Example 2"]
    }
  ],
  "lessonOutline": {
    "introduction": "Introduction content",
    "mainContent": "Main content",
    "conclusion": "Conclusion content"
  },
  "activities": [
    {
      "type": "exercise",
      "title": "Activity Title",
      "description": "Activity description",
      "duration": 15,
      "content": "Detailed activity content",
      "materials": ["Material 1", "Material 2"],
      "instructions": "Step-by-step instructions"
    }
  ],
  "homework": {
    "assignments": [
      {
        "title": "Assignment Title",
        "description": "Assignment description",
        "dueDate": "2025-09-15",
        "estimatedTime": 30
      }
    ],
    "readingMaterials": [
      {
        "title": "Reading Title",
        "source": "Textbook",
        "pages": "10-15"
      }
    ]
  },
  "resources": {
    "textbooks": [
      {
        "title": "Textbook Title",
        "author": "Author Name",
        "chapters": "Chapter 1-3"
      }
    ],
    "onlineResources": [
      {
        "title": "Resource Title",
        "url": "https://example.com",
        "description": "Resource description"
      }
    ],
    "multimedia": [
      {
        "type": "video",
        "title": "Video Title",
        "url": "https://video.com",
        "description": "Video description"
      }
    ],
    "additionalMaterials": ["Material 1", "Material 2"]
  },
  "assessment": {
    "formativeAssessment": [
      {
        "type": "quiz",
        "description": "Assessment description",
        "criteria": ["Criteria 1", "Criteria 2"]
      }
    ],
    "summativeAssessment": [
      {
        "type": "test",
        "description": "Test description",
        "rubric": [
          {
            "criteria": "Assessment criteria",
            "levels": [
              {
                "level": "Excellent",
                "description": "Level description",
                "points": 4
              }
            ]
          }
        ]
      }
    ]
  },
  "differentiation": {
    "forAdvancedLearners": ["Strategy 1", "Strategy 2"],
    "forStruggling": ["Strategy 1", "Strategy 2"],
    "forELL": ["Strategy 1", "Strategy 2"],
    "forSpecialNeeds": ["Strategy 1", "Strategy 2"]
  },
  "standards": [
    {
      "standardType": "Common Core",
      "standardCode": "CCSS.MATH.8.EE.A.1",
      "description": "Standard description"
    }
  ],
  "tags": ["algebra", "mathematics", "grade8"],
  "difficulty": "intermediate",
  "isPublic": false,
  "createdAt": "2025-09-12T10:00:00.000Z",
  "updatedAt": "2025-09-12T10:00:00.000Z",
  "lastEdited": "2025-09-12T10:00:00.000Z",
  "version": 1
}
```

## Activity Types

Supported activity types:
- `reading`: Reading activities and comprehension
- `exercise`: Practice exercises and worksheets
- `video`: Video content and multimedia
- `discussion`: Class discussions and group talks
- `project`: Projects and collaborative work
- `quiz`: Quizzes and quick assessments
- `practice`: Skill practice and drills

## Grade Levels

Supported grade level mappings:
- **Elementary**: K, 1, 2, 3, 4, 5
- **Middle**: 6, 7, 8
- **High**: 9, 10, 11, 12

## Subjects

Supported subjects:
- mathematics
- science  
- language_arts
- social_studies
- art
- music
- physical_education
- technology
- foreign_language

## Export Formats

Available export formats:
- **PDF**: Text-based lesson plan (expandable to actual PDF)
- **Google Docs**: Google Docs compatible format
- **LMS**: Learning Management System compatible JSON
- **JSON**: Raw lesson data in JSON format

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing or invalid parameters)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not Found (lesson not found)
- `500`: Internal Server Error

## Usage Examples

### Creating a Lesson with AI

```javascript
const response = await fetch('/api/lessons', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    topic: 'Photosynthesis',
    gradeLevel: '7',
    subject: 'science',
    teachingObjectives: [
      'Understand the process of photosynthesis',
      'Identify factors affecting photosynthesis'
    ],
    useAI: true
  })
});

const result = await response.json();
```

### Fetching User Lessons

```javascript
const response = await fetch('/api/lessons?subject=mathematics&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
```

### Exporting a Lesson

```javascript
const response = await fetch('/api/lessons/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    lessonId: 'lesson_id',
    format: 'pdf'
  })
});

const blob = await response.blob();
// Handle file download
```

## User Integration

The lesson creator is fully integrated with the User model. All lessons are stored in the user's `lessons` array field:

```javascript
// User object structure
{
  "_id": "user_id",
  "email": "user@example.com",
  "username": "username",
  // ... other user fields
  "lessons": [
    // Array of lesson objects
  ]
}
```

## Notes

1. **AI Integration**: The API uses Gemini AI for intelligent lesson generation when `useAI: true` is specified.

2. **Real-time Suggestions**: The inline editor can be implemented on the frontend with real-time AI suggestions.

3. **Version Control**: Lessons maintain version history with automatic incrementing.

4. **Scalability**: The nested document approach works well for moderate lesson volumes. For high-volume applications, consider separate Lesson collection with user references.

5. **File Uploads**: Future enhancement could include actual file upload support for multimedia resources.

6. **Collaborative Features**: The structure supports future collaborative editing features.

This API provides a solid foundation for a comprehensive lesson planning system with AI assistance and multiple export options.
