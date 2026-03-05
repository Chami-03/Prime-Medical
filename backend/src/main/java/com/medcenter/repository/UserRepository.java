package com.medcenter.repository;

import com.medcenter.entity.User;
import com.medcenter.enums.RoleName;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRolesName(RoleName roleName);
}
