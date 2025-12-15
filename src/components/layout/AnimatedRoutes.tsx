import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '../../pages/Home';
import Login from '../../pages/Login';
import Register from '../../pages/Register';
import Profile from '../../pages/Profile';
import AIChatPage from '../../pages/AIChatPage';
import Community from '../../pages/Community';
import PostDetail from '../../pages/PostDetail';
import MyPosts from '../../pages/MyPosts';
import Activity from '../../pages/Activity';
import Settings from '../../pages/Settings';
import RequireAuth from '../auth/RequireAuth';

const pageVariants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        filter: 'blur(10px)',
    },
    animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const, // Custom easing
        },
    },
    exit: {
        opacity: 0,
        x: -20,
        filter: 'blur(10px)',
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
                <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
                <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />

                {/* Protected Routes */}
                <Route path="/profile" element={<RequireAuth><AnimatedPage><Profile /></AnimatedPage></RequireAuth>} />
                <Route path="/mu-ai" element={<RequireAuth><AnimatedPage><AIChatPage /></AnimatedPage></RequireAuth>} />
                <Route path="/community" element={<RequireAuth><AnimatedPage><Community /></AnimatedPage></RequireAuth>} />
                <Route path="/post/:id" element={<RequireAuth><AnimatedPage><PostDetail /></AnimatedPage></RequireAuth>} />
                <Route path="/my-posts" element={<RequireAuth><AnimatedPage><MyPosts /></AnimatedPage></RequireAuth>} />
                <Route path="/activity" element={<RequireAuth><AnimatedPage><Activity /></AnimatedPage></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><AnimatedPage><Settings /></AnimatedPage></RequireAuth>} />
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
