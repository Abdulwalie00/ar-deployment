package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByProjectId(String projectId);
}