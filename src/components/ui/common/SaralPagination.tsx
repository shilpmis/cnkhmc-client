import React, { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export const SaralPagination: React.FC<{
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {

    // Function to generate dynamic page numbers
    const visiblePages = useMemo(() => {
        const delta = 2; // Number of pages to show before/after the current page
        const pages = [];

        for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
            pages.push(i);
        }

        // Handle start ellipsis
        if (pages[0] > 2) {
            pages.unshift(-1); // -1 represents an ellipsis
        }
        if (pages[0] !== 1) {
            pages.unshift(1); // Add the first page
        }
        
        // Handle end ellipsis
        if (pages[pages.length - 1] < totalPages - 1) {
            pages.push(-1); // -1 represents an ellipsis
        }
        if (pages[pages.length - 1] !== totalPages) {
            pages.push(totalPages); // Add the last page
        }

        return pages;
    }, [currentPage, totalPages]);

    
    const handlePriviosPage = (page : number) =>{
        onPageChange(page)
    }
    
    const handleNextPage = (page : number) =>{
        onPageChange(page)
    }

    return (
        <Pagination>
            <PaginationContent>
                {/* Previous Button */}
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) handlePriviosPage(currentPage - 1);
                        }}
                        aria-disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </PaginationPrevious>
                </PaginationItem>

                {/* Page Numbers */}
                {visiblePages.map((page, index) =>
                    page === -1 ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={page}>
                            <PaginationLink
                                href="#"
                                isActive={currentPage === page}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage !== page) onPageChange(page);
                                }}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    )
                )}

                {/* Next Button */}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) handleNextPage(currentPage + 1);
                        }}
                        aria-disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </PaginationNext>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
