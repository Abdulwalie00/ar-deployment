package com.lds.ppdoarbackend.controller;


import com.lds.ppdoarbackend.config.AppConstants;
import com.lds.ppdoarbackend.dto.ProjectDto;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.ProjectImage;
import com.lds.ppdoarbackend.repository.ProjectRepository;
import com.lds.ppdoarbackend.service.OllamaService;
import com.lds.ppdoarbackend.service.ProjectService;
import com.lds.ppdoarbackend.service.UserService;
import com.lds.ppdoarbackend.model.User;


import io.jsonwebtoken.io.IOException;


import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;


import java.io.InputStream;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserService userService;


    @Autowired
    private OllamaService ollamaService;

    @GetMapping
    public List<Project> getAllProjects(@RequestParam(required = false) String divisionCode,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) Integer year,
                                        @RequestParam(required = false) Integer aipYear) {
        return projectService.getAllProjects(divisionCode, status, year, aipYear);
    }

    @GetMapping("/archived")
    public List<Project> getArchivedProjects() {
        return projectService.getArchivedProjects();
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable String id) {
        return projectService.getProjectById(id);
    }

    @PostMapping
    public Project createProject(@RequestBody ProjectDto projectDto) {
        return projectService.createProject(projectDto);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable String id, @RequestBody ProjectDto projectDto) {
        return projectService.updateProject(id, projectDto);
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
    }

     @GetMapping("/new")
        public List<ProjectDto> getNewProjects(@AuthenticationPrincipal UserDetails userDetails) {
            User currentUser = userService.getUserByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Current user not found in database"));
            return projectService.getUnreadProjects(currentUser.getId());
        }

    // In ProjectController.java
    @PostMapping("/{id}/generate-narrative")
    public ResponseEntity<?> generateNarrative(@PathVariable String id) {
        Project project = projectService.getProjectById(id);
        if (project == null) return ResponseEntity.notFound().build();

        String prompt = buildNarrativePrompt(project); // Compose your prompt as described
        String narrative = ollamaService.generateNarrative(prompt); // Call Ollama

        
        project.setNarrativeReport(narrative);

       projectRepository.save(project);

        return ResponseEntity.ok(narrative);
    }

    @GetMapping("/{id}/download-narrative")
    public ResponseEntity<byte[]> downloadNarrative(@PathVariable String id) throws IOException, java.io.IOException {
        Project project = projectService.getProjectById(id);
        XWPFDocument doc = new XWPFDocument();

        // Title - bold and large
        XWPFParagraph titlePara = doc.createParagraph();
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setText(project.getTitle());
        titleRun.setBold(true);
        titleRun.setFontSize(16);
        titlePara.setSpacingAfter(200);

        String narrative = project.getNarrativeReport();
        Pattern thinkPattern = Pattern.compile("<think>.*?</think>", Pattern.DOTALL);
        Matcher matcher = thinkPattern.matcher(narrative);
        String cleanedNarrative = matcher.replaceAll("");

        // Now split and add paragraphs as before
        String[] paragraphs = cleanedNarrative.split("\\n\\n");
        for (String paraText : paragraphs) {
            XWPFParagraph para = doc.createParagraph();
            XWPFRun run = para.createRun();
            run.setText(paraText.trim());
            para.setSpacingAfter(100);
        }

        for (ProjectImage img : project.getImages()) {
            try (InputStream imgStream = getImageInputStream(img.getImageUrl())) {
                String fileName = img.getImageUrl();
                if (fileName.startsWith("/api/files/")) {
                    fileName = fileName.substring("/api/files/".length());
                }
                int pictureType = fileName.toLowerCase().endsWith(".png") ? XWPFDocument.PICTURE_TYPE_PNG : XWPFDocument.PICTURE_TYPE_JPEG;

                XWPFParagraph imgPara = doc.createParagraph();
                XWPFRun imgRun = imgPara.createRun();
                imgRun.addPicture(
                    imgStream,
                    pictureType,
                    img.getId(),
                    Units.toEMU(400), Units.toEMU(300)
                );
                imgPara.setSpacingAfter(50);

                XWPFParagraph captionPara = doc.createParagraph();
                XWPFRun captionRun = captionPara.createRun();
                captionRun.setText(img.getCaption());
                captionRun.setItalic(true);
                captionPara.setSpacingAfter(200);
            } catch (Exception e) {
                e.printStackTrace(); // Log error, skip image
            }
        }


        ByteArrayOutputStream out = new ByteArrayOutputStream();
        doc.write(out);
        doc.close();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        headers.setContentDisposition(ContentDisposition.attachment().filename("NarrativeReport.docx").build());

        return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);


    }

    private InputStream getImageInputStream(String imageUrl) throws java.io.IOException {
        if (imageUrl == null) throw new java.io.FileNotFoundException("Image URL is null");
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            // Remote image
            return new java.net.URL(imageUrl).openStream();
        } else {
            // Local image in project-images folder
            String fileName = imageUrl;
            if (fileName.startsWith("/api/files/")) {
                fileName = fileName.substring("/api/files/".length());
            }
            String filePath = AppConstants.PROJECT_IMAGES_DIR + fileName;
            java.io.File file = new java.io.File(filePath);
            if (!file.exists()) throw new java.io.FileNotFoundException("Image not found: " + filePath);
            return new java.io.FileInputStream(file);
        }
    }

    // ...existing code...
    private String buildNarrativePrompt(Project project) {
        StringBuilder sb = new StringBuilder();
        sb.append("Generate a narrative report for the following project: You are a professional report writer assigned to draft a well-written and coherent Accomplishment Narrative Report based on structured inputs provided by a government office.\n");
        sb.append("Use the details below to write a formal, comprehensive, and reader-friendly narrative report suitable for submission to supervisors, partners, or oversight bodies.\n");
        sb.append("Follow this format in the narrative:\n");
        sb.append("1. Title of the Activity – Use as the report title.\n");
        sb.append("2. Date and Venue of Implementation – Clearly state when and where the activity was conducted.\n");
        sb.append("3. Background and Objectives – Explain the context and goals of the activity.\n");
        sb.append("4. Highlights of the Implementation – Describe what took place during the activity, including steps undertaken, key participants, and program flow.\n");
        sb.append("5. Results and Outcomes – Summarize the results, outputs, participation level, and key accomplishments.\n");
        sb.append("6. Observations and Noteworthy Insights – Include significant observations, challenges encountered, and learnings.\n");
        sb.append("7. Conclusion and Next Steps – End with a summary and, if applicable, proposed recommendations or follow-up actions.\n\n");
        sb.append("________________________________________\n");
        sb.append("Structured Inputs:\n");
        sb.append("• Title of the Activity: ").append(project.getTitle()).append("\n");
        sb.append("• Date of Implementation: ").append(project.getStartDate() != null ? project.getStartDate() : "").append("\n");
        sb.append("• Venue: ").append(project.getLocation() != null ? project.getLocation() : "").append("\n");
        sb.append("• Office/Division Involved: ").append(project.getDivision() != null ? project.getDivision().getName() : "").append("\n");
        sb.append("• Brief Background and Objectives: ").append(project.getObjectives() != null ? project.getObjectives() : "").append("\n");
        sb.append("• Summary of Actual Implementation: ").append(project.getDescription() != null ? project.getDescription() : "").append("\n");
        sb.append("• Participants/Stakeholders Involved: ").append(project.getTargetParticipant() != null ? project.getTargetParticipant() : "").append("\n");
        sb.append("• Outcomes/Achievements: ").append(project.getRemarks() != null ? project.getRemarks() : "").append("\n");
        sb.append("• Challenges and Recommendations: ").append(project.getStatus() != null ? project.getStatus() : "").append("\n");
        sb.append("________________________________________\n");
        sb.append("Guidelines:\n");
        sb.append("• Write in formal and objective tone, with clarity and coherence.\n");
        sb.append("• Structure it like a government report – concise but detailed.\n");
        sb.append("• Emphasize impact and relevance to the community/agency’s goals.\n");
        sb.append("• Ensure that the narrative flows logically from introduction to conclusion.\n");
        sb.append("• Avoid repeating exact user inputs; instead, rephrase and expand to sound like a full narrative written by a communications professional.\n");
        return sb.toString();
    }
// ...existing
}