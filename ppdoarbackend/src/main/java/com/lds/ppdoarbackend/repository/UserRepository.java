package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByDivision(Division division);
    List<User> findByRoleIn(List<String> roles);
}