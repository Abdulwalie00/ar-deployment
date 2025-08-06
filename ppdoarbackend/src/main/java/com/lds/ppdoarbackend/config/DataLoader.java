package com.lds.ppdoarbackend.config;

import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.DivisionRepository;
import com.lds.ppdoarbackend.repository.ProjectRepository;
import com.lds.ppdoarbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create a default superadmin user if one doesn't exist
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            User superAdminUser = new User();
            superAdminUser.setFirstName("Super");
            superAdminUser.setLastName("Admin");
            superAdminUser.setEmail("superadmin@example.com");
            superAdminUser.setUsername("superadmin");
            superAdminUser.setPasswordHash(passwordEncoder.encode("password"));
            superAdminUser.setRole("ROLE_SUPERADMIN");
            superAdminUser.setCreatedAt(new Date());
            superAdminUser.setUpdatedAt(new Date());
            userRepository.save(superAdminUser);
            System.out.println("Created superadmin user");
        }

        // Create a default admin user if one doesn't exist
        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = new User();
            adminUser.setFirstName("Admin");
            adminUser.setLastName("User");
            adminUser.setEmail("admin@example.com");
            adminUser.setUsername("admin");
            adminUser.setPasswordHash(passwordEncoder.encode("password"));
            adminUser.setRole("ROLE_ADMIN");
            adminUser.setCreatedAt(new Date());
            adminUser.setUpdatedAt(new Date());

            userRepository.save(adminUser);
            System.out.println("Created admin user");
        }

        // Division code-name pairs
        Map<String, String> divisions = Map.ofEntries(
                Map.entry("PTCAO", "Provincial Tourism and Cultural Affairs Office"),
                Map.entry("PDD", "Provincial Development Department"),
                Map.entry("ICTO", "Information and Communication Technology Office"),
                Map.entry("RYDO", "Rizal Youth Development Office"),
                Map.entry("PWO", "Provincial Welfare Office"),
                Map.entry("PLPP", "Provincial Legal and Public Protection"),
                Map.entry("PTLDC", "Provincial Training and Livelihood Development Center"),
                Map.entry("LEDIPO", "Local Economic Development and Investment Promotions Office"),
                Map.entry("GAD", "Gender and Development"),
                Map.entry("OPVG", "Office of the Provincial Vice Governor"),
                Map.entry("PEO", "Provincial Engineering Office"),
                Map.entry("PIO", "Provincial Information Office"),
                Map.entry("PCO", "Provincial Cooperative Office"),
                Map.entry("OPAG", "Office of the Provincial Agriculturist"),
                Map.entry("PENRO", "Provincial Environment and Natural Resources Office"),
                Map.entry("PSWDO", "Provincial Social Welfare and Development Office"),
                Map.entry("PHO", "Provincial Health Office"),
                Map.entry("PVO", "Provincial Veterinary Office"),
                Map.entry("PPDO", "Provincial Planning and Development Office"),
                Map.entry("PHRMO", "Provincial Human Resource Management Office"),
                Map.entry("PGSO", "Provincial General Services Office"),
                Map.entry("PTO", "Provincial Treasurer's Office"),
                Map.entry("PACCO", "Provincial Accounting Office"),
                Map.entry("PBO", "Provincial Budget Office"),
                Map.entry("PLSO", "Provincial Legal Services Office"),
                Map.entry("PSF", "Provincial Security Force"),
                // Add your new entry here
                Map.entry("PMO", "Project Management Office"),
                Map.entry("PPP", "Provincial Security Force")
        );

        for (Map.Entry<String, String> entry : divisions.entrySet()) {
            String code = entry.getKey();
            String name = entry.getValue();

            // Check if the division already exists to avoid duplicates
            Optional<Division> existingDivision = divisionRepository.findByCode(code);

            if (existingDivision.isEmpty()) {
                Division division = new Division();
                division.setId(UUID.randomUUID().toString());
                division.setCode(code);
                division.setName(name);
                division.setDateCreated(new Date());
                division.setDateUpdated(new Date());

                divisionRepository.save(division);
                System.out.println("Created division: " + name);

                // *** START: Added code to create a user for the new division ***
                String username = code.toLowerCase() + "_user";
                if (userRepository.findByUsername(username).isEmpty()) {
                    User divisionUser = new User();
                    divisionUser.setFirstName(name);
                    divisionUser.setLastName("User");
                    divisionUser.setEmail(code.toLowerCase() + "@example.com");
                    divisionUser.setUsername(username);
                    divisionUser.setPasswordHash(passwordEncoder.encode("password")); // Set a default password
                    divisionUser.setRole("ROLE_USER"); // Set a default role
                    divisionUser.setDivision(division); // Assign the new division
                    divisionUser.setCreatedAt(new Date());
                    divisionUser.setUpdatedAt(new Date());

                    userRepository.save(divisionUser);
                    System.out.println("Created user for division: " + name);
                }
                // *** END: Added code ***


                // Create a sample project for the new division
                Project sampleProject = new Project();
                sampleProject.setId(UUID.randomUUID().toString());
                sampleProject.setTitle("Sample Project for " + code);
                sampleProject.setDescription("This is a sample project for " + name);
                sampleProject.setLocation("City Hall");
                sampleProject.setStartDate(new Date());
                sampleProject.setEndDate(new Date());
                sampleProject.setImplementationSchedule(new Date());
                sampleProject.setDateOfAccomplishment(new Date());
                sampleProject.setBudget(50000.00);
                sampleProject.setPercentCompletion(50.0);
                sampleProject.setFundSource("General Fund");
                sampleProject.setStatus("ongoing");
                sampleProject.setTargetParticipant("Participants from " + name);
                sampleProject.setOfficeInCharge("Office of the Mayor");
                sampleProject.setRemarks("This is a sample remark.");
                sampleProject.setDivision(division);
                sampleProject.setDateCreated(new Date());
                sampleProject.setDateUpdated(new Date());

                projectRepository.save(sampleProject);
                System.out.println("Created sample project for: " + code);
            } else {
                System.out.println("Division already exists: " + name);
            }
        }
    }
}