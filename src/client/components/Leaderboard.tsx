import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats } from '../../shared/types/index.js';
import { UserService } from '../services/user.js';
import './Leaderboard.css';

interface LeaderboardEntry extends UserProfile, UserStats {}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const usersPerPage = 25;

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?page=${currentPage}&limit=${usersPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data.users || []);
        setTotalUsers(data.data.totalUsers || 0);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
        // Show placeholder data for development
        setLeaderboard(generatePlaceholderData());
        setTotalUsers(100);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      // Show placeholder data for development
      setLeaderboard(generatePlaceholderData());
      setTotalUsers(100);
    } finally {
      setLoading(false);
    }
  };

  const generatePlaceholderData = (): LeaderboardEntry[] => {
    // Generate some realistic placeholder data
    const placeholderProfiles: UserProfile[] = [
      {
        user_id: '1',
        username: 'CipherMaster',
        solves_count: 15,
        successful_rallies: 45,
        total_rallies: 60,
        breadcrumbs_collected: [],
        titles: [{ name: 'Master Locksmith', earned_at: Date.now(), requirements_met: [] }],
        avg_solve_time_seconds: 1800,
        difficulty_breakdown: { easy: 8, medium: 5, hard: 2 },
        rally_accuracy_percentage: 75,
        join_timestamp: Date.now() - 86400000,
        last_active: Date.now()
      },
      {
        user_id: '2',
        username: 'VaultBreaker',
        solves_count: 12,
        successful_rallies: 38,
        total_rallies: 55,
        breadcrumbs_collected: [],
        titles: [{ name: 'Locksmith', earned_at: Date.now(), requirements_met: [] }],
        avg_solve_time_seconds: 2100,
        difficulty_breakdown: { easy: 7, medium: 4, hard: 1 },
        rally_accuracy_percentage: 69,
        join_timestamp: Date.now() - 172800000,
        last_active: Date.now() - 3600000
      },
      {
        user_id: '3',
        username: 'CodeCracker',
        solves_count: 8,
        successful_rallies: 25,
        total_rallies: 40,
        breadcrumbs_collected: [],
        titles: [{ name: 'Locksmith', earned_at: Date.now(), requirements_met: [] }],
        avg_solve_time_seconds: 2400,
        difficulty_breakdown: { easy: 6, medium: 2, hard: 0 },
        rally_accuracy_percentage: 62,
        join_timestamp: Date.now() - 259200000,
        last_active: Date.now() - 7200000
      }
    ];

    // Calculate scores and add stats
    return placeholderProfiles.map((profile, index) => {
      const scoreBreakdown = UserService.calculateScoreBreakdown(profile);
      return {
        ...profile,
        total_score: scoreBreakdown.totalScore,
        rank: index + 1,
        speed_bonus: scoreBreakdown.speedBonus,
        rally_bonus: scoreBreakdown.rallyBonus
      };
    });
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const getRankChange = (rank: number): string => {
    // Placeholder logic - in real implementation, compare with previous rankings
    if (rank <= 3) return '↑';
    if (rank <= 10) return '→';
    return '↓';
  };

  // Utility function for formatting time (will be used in future enhancements)
  // const formatTime = (seconds: number): string => {
  //   const hours = Math.floor(seconds / 3600);
  //   const minutes = Math.floor((seconds % 3600) / 60);
  //   if (hours > 0) {
  //     return `${hours}h ${minutes}m`;
  //   }
  //   return `${minutes}m`;
  // };

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <div className="leaderboard-stats">
          <span className="total-users">{totalUsers} Solvers</span>
        </div>
      </div>

      <div className="leaderboard-content">
        {leaderboard.map((user) => (
          <div key={user.user_id} className={`leaderboard-entry ${user.rank <= 3 ? 'top-three' : ''}`}>
            <div className="rank-section">
              <span className="rank-number">#{user.rank}</span>
              <span className={`rank-change ${getRankChange(user.rank)}`}>
                {getRankChange(user.rank)}
              </span>
            </div>

            <div className="user-section">
              <div className="username">{user.username}</div>
              <div 
                className="user-title"
                style={{ color: UserService.getTitleColor(UserService.getHighestTitle(user)) }}
              >
                {UserService.getHighestTitle(user)}
              </div>
            </div>

            <div className="stats-section">
              <div className="primary-stat">
                <span className="stat-value">{user.total_score}</span>
                <span className="stat-label">Score</span>
              </div>
              <div className="secondary-stats">
                <div className="stat-item">
                  <span className="stat-value">{user.solves_count}</span>
                  <span className="stat-label">Solves</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{user.rally_accuracy_percentage}%</span>
                  <span className="stat-label">Rally</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="leaderboard-pagination">
          <button 
            className="page-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ←
          </button>
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          <button 
            className="page-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
